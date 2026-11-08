import "server-only";

import { createHmac } from "node:crypto";

import type { z } from "zod";

import { db } from "@/db/client";
import type { MatchSubmissionRow, Player } from "@/db/schema";
import { GUEST_SEAT } from "@/lib/domain";
import { recordAudit } from "@/server/audit/repository";
import { clientKey } from "@/server/auth/login-limit";
import { getServerEnv } from "@/server/env";
import { HttpError, issuesOf, type FieldIssue } from "@/server/http";
import { matchInputSchema } from "@/server/matches/schema";
import { createMatches } from "@/server/matches/service";
import { listPlayers, toPlayerRef } from "@/server/players/repository";
import { createGuest } from "@/server/players/service";

import { countRecentByIpHash, getById, insertSubmission, listPending, markDecided } from "./repository";
import {
  placeholderGuestIds,
  submissionInputSchema,
  submitBodySchema,
  toMatchInput,
  type SeatView,
  type SubmissionInput,
  type SubmissionView,
} from "./schema";

const MAX_BODY_BYTES = 8192;
const WINDOW_MS = 15 * 60_000;
const MAX_PER_WINDOW = 5;

interface Actor {
  actor: string;
  via: "chat" | "ui";
}

type Seat = SubmissionInput["sideA"][number];

/** Reads at most `maxBytes` of the body, so a huge or endless upload is cut off instead of buffered. */
async function readCappedText(request: Request, maxBytes: number): Promise<string> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new HttpError("too_large");
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError("too_large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Keyed hash of the client IP; the key derives from SESSION_SECRET, so no new env var and no raw IP at rest. */
export function ipHash(request: Request): string {
  const key = createHmac("sha256", getServerEnv().SESSION_SECRET).update("match-submission-ip").digest();
  return createHmac("sha256", key).update(clientKey(request)).digest("hex");
}

function invalid(error: z.ZodError): HttpError {
  return new HttpError("invalid_body", error.issues.map((i) => i.message).join("; "), { issues: issuesOf(error) });
}

function invalidIssues(issues: FieldIssue[]): HttpError {
  return new HttpError("invalid_body", issues.map((i) => i.message).join("; "), { issues });
}

function seatsOf(input: SubmissionInput): { path: (string | number)[]; seat: Seat }[] {
  return (["sideA", "sideB"] as const).flatMap((side) =>
    input[side].map((seat, index) => ({ path: [side, index], seat })),
  );
}

const lower = (name: string) => name.trim().toLowerCase();

function unknownPlayerIssues(input: SubmissionInput, roster: Player[]): FieldIssue[] {
  const ids = new Set(roster.map((p) => p.id));
  return seatsOf(input).flatMap(({ path, seat }) =>
    "playerId" in seat && !ids.has(seat.playerId)
      ? [{ path: [...path, "playerId"], message: "unknown or inactive player" }]
      : [],
  );
}

function memberNameIssues(input: SubmissionInput, roster: Player[]): FieldIssue[] {
  const members = new Set(roster.filter((p) => !p.guest).map((p) => lower(p.name)));
  return seatsOf(input).flatMap(({ path, seat }) =>
    "guestName" in seat && members.has(lower(seat.guestName))
      ? [{ path: [...path, "guestName"], message: "member name, pick the member" }]
      : [],
  );
}

/** A typed guest name that is an existing guest is that player, so it may not also sit as a `playerId`. */
function duplicateIssues(input: SubmissionInput, roster: Player[]): FieldIssue[] {
  const existing = roster.filter((p) => p.guest).map((p) => [lower(p.name), p.id] as const);
  const mapped = matchInputSchema.safeParse(toMatchInput(input, new Map([...placeholderGuestIds(input), ...existing])));
  return mapped.success ? [] : issuesOf(mapped.error);
}

async function enforceRateLimit(hash: string): Promise<void> {
  const now = Date.now();
  // shortcut: count-then-insert is not atomic, so parallel requests can overshoot 5; fine for a lunch scoreboard, add an advisory lock if abused.
  const { count, oldest } = await countRecentByIpHash(hash, new Date(now - WINDOW_MS));
  if (count < MAX_PER_WINDOW) return;
  const waitMs = oldest ? oldest.getTime() + WINDOW_MS - now : WINDOW_MS;
  throw new HttpError("rate_limited", undefined, { retryAfter: Math.max(1, Math.ceil(waitMs / 1000)) });
}

/** The public form's write: stores a pending row only; nothing reaches `matches` or `players` before the admin approves. */
export async function submitMatch(request: Request): Promise<{ ok: true } | { id: string; status: "pending" }> {
  const text = await readCappedText(request, MAX_BODY_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError("invalid_body");
  }
  const parsed = submitBodySchema.safeParse(body);
  if (!parsed.success) throw invalid(parsed.error);
  const { website, ...input } = parsed.data;
  if (website?.trim()) return { ok: true };

  const hash = ipHash(request);
  await enforceRateLimit(hash);

  const roster = await listPlayers();
  const issues = [...unknownPlayerIssues(input, roster), ...memberNameIssues(input, roster)];
  if (issues.length === 0) issues.push(...duplicateIssues(input, roster));
  if (issues.length > 0) throw invalidIssues(issues);

  const row = await insertSubmission({ payload: input, submitter: input.submitter || null, ipHash: hash });
  return { id: row.id, status: "pending" };
}

function toView(row: MatchSubmissionRow, refs: Map<number, SeatView>): SubmissionView {
  // Cast: the column is written only by this service from a validated body.
  const input = (row.edited ?? row.payload) as SubmissionInput;
  const seatView = (seat: Seat): SeatView =>
    "guestName" in seat
      ? { name: seat.guestName, guest: true, isNew: true }
      : (refs.get(seat.playerId) ?? { ...GUEST_SEAT, id: seat.playerId, name: "?" });
  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    matchId: row.matchId,
    submitter: row.submitter,
    input,
    gameType: input.gameType,
    format: input.format,
    sideA: input.sideA.map(seatView),
    sideB: input.sideB.map(seatView),
    winnerSide: input.winnerSide,
    scoreA: input.scoreA ?? null,
    scoreB: input.scoreB ?? null,
    scores: input.scores?.length ? input.scores : null,
    bill: input.bill ?? null,
    note: input.note || null,
    date: input.date ?? null,
  };
}

async function viewsOf(rows: MatchSubmissionRow[]): Promise<SubmissionView[]> {
  if (rows.length === 0) return [];
  const roster = await listPlayers({ includeInactive: true });
  const refs = new Map<number, SeatView>(roster.map((p) => [p.id, toPlayerRef(p)]));
  return rows.map((row) => toView(row, refs));
}

export async function listPendingSubmissions(): Promise<SubmissionView[]> {
  return viewsOf(await listPending());
}

/** What the audit log keeps of a submission: never the IP hash. */
function auditShape(row: MatchSubmissionRow) {
  return { status: row.status, matchId: row.matchId, input: row.edited ?? row.payload };
}

/** Typed guest names become real guests (an existing guest of that name is reused); returns lowercase name → id. */
async function ensureGuests(input: SubmissionInput): Promise<Map<string, number>> {
  const names = new Map<string, string>();
  for (const { seat } of seatsOf(input)) {
    if ("guestName" in seat && !names.has(lower(seat.guestName))) names.set(lower(seat.guestName), seat.guestName);
  }
  const created = await Promise.all(
    [...names].map(async ([key, name]) => [key, (await createGuest(name)).id] as const),
  );
  return new Map(created);
}

async function approvedResult(row: MatchSubmissionRow | undefined) {
  if (row?.status !== "approved" || !row.matchId) throw new HttpError("conflict");
  return { submission: (await viewsOf([row]))[0]!, matchId: row.matchId };
}

/**
 * Turns a pending submission into a match: guests are created, the match is written with the key
 * `sub-<id>` (a repeat returns the same match), then the row is decided. Approving an approved one
 * returns its match; a rejected one is a conflict.
 */
export async function approveSubmission(
  id: string,
  { edited, actor, via }: Actor & { edited?: SubmissionInput },
): Promise<{ submission: SubmissionView; matchId: string }> {
  const row = await getById(id);
  if (!row) throw new HttpError("not_found");
  if (row.status !== "pending") return approvedResult(row);

  const parsed = submissionInputSchema.safeParse(edited ?? row.payload);
  if (!parsed.success) throw invalid(parsed.error);
  const input = parsed.data;

  const roster = await listPlayers();
  const unknown = unknownPlayerIssues(input, roster);
  if (unknown.length > 0) throw invalidIssues(unknown);
  // A member took the guest's name since it was submitted.
  if (memberNameIssues(input, roster).length > 0) throw new HttpError("conflict");

  const guestIds = await ensureGuests(input);
  const matchInput = matchInputSchema.safeParse(toMatchInput(input, guestIds));
  if (!matchInput.success) throw invalid(matchInput.error);

  const { matches } = await createMatches([matchInput.data], { actor, via }, { idempotencyKey: `sub-${id}` });
  const matchId = matches[0]?.id;
  if (!matchId) throw new Error("approved submission created no match");

  const decided = await db.transaction(async (tx) => {
    const done = await markDecided(id, { status: "approved", matchId, edited: edited && input }, tx);
    if (done) {
      await recordAudit(tx, {
        actor,
        via,
        action: "approve",
        entity: "submission",
        entityId: id,
        before: auditShape(row),
        after: auditShape(done),
      });
    }
    return done;
  });
  return approvedResult(decided ?? (await getById(id)));
}

export async function rejectSubmission(id: string, { actor, via }: Actor): Promise<{ submission: SubmissionView }> {
  const row = await getById(id);
  if (!row) throw new HttpError("not_found");
  if (row.status === "approved") throw new HttpError("conflict");
  if (row.status === "rejected") return { submission: (await viewsOf([row]))[0]! };

  const decided = await db.transaction(async (tx) => {
    const done = await markDecided(id, { status: "rejected" }, tx);
    if (done) {
      await recordAudit(tx, {
        actor,
        via,
        action: "reject",
        entity: "submission",
        entityId: id,
        before: auditShape(row),
        after: auditShape(done),
      });
    }
    return done;
  });
  // Lost a race with a concurrent decision: report what it decided.
  const final = decided ?? (await getById(id));
  if (final?.status !== "rejected") throw new HttpError("conflict");
  return { submission: (await viewsOf([final]))[0]! };
}
