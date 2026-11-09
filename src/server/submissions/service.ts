import "server-only";

import type { z } from "zod";

import { db } from "@/db/client";
import type { MatchSubmissionRow, Player } from "@/db/schema";
import { GUEST_SEAT } from "@/lib/domain";
import { recordAudit } from "@/server/audit/repository";
import { HttpError, issuesOf, type FieldIssue } from "@/server/http";
import { matchInputSchema } from "@/server/matches/schema";
import { createMatches } from "@/server/matches/service";
import { listPlayers, toPlayerRef } from "@/server/players/repository";
import { createGuest } from "@/server/players/service";

import { getById, listPending, markDecided } from "./repository";
import {
  placeholderGuestIds,
  submissionInputSchema,
  toMatchInput,
  type SeatView,
  type SubmissionInput,
  type SubmissionView,
} from "./schema";

interface Actor {
  actor: string;
  via: "chat" | "ui";
}

export type Seat = SubmissionInput["sideA"][number];

function invalid(error: z.ZodError): HttpError {
  return new HttpError("invalid_body", error.issues.map((i) => i.message).join("; "), { issues: issuesOf(error) });
}

export function invalidIssues(issues: FieldIssue[]): HttpError {
  return new HttpError("invalid_body", issues.map((i) => i.message).join("; "), { issues });
}

type Seated = Pick<SubmissionInput, "sideA" | "sideB">;

export function seatsOf(input: Seated): { path: (string | number)[]; seat: Seat }[] {
  return (["sideA", "sideB"] as const).flatMap((side) =>
    input[side].map((seat, index) => ({ path: [side, index], seat })),
  );
}

const lower = (name: string) => name.trim().toLowerCase();

function unknownPlayerIssues(input: Seated, roster: Player[]): FieldIssue[] {
  const ids = new Set(roster.map((p) => p.id));
  return seatsOf(input).flatMap(({ path, seat }) =>
    "playerId" in seat && !ids.has(seat.playerId)
      ? [{ path: [...path, "playerId"], message: "unknown or inactive player" }]
      : [],
  );
}

function memberNameIssues(input: Seated, roster: Player[]): FieldIssue[] {
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

/** Seats against the live roster: known active players, no member's name typed as a guest, nobody twice. */
export function rosterIssues(input: SubmissionInput, roster: Player[]): FieldIssue[] {
  const issues = [...unknownPlayerIssues(input, roster), ...memberNameIssues(input, roster)];
  return issues.length > 0 ? issues : duplicateIssues(input, roster);
}

function toView(row: MatchSubmissionRow, refs: Map<number, SeatView>): SubmissionView {
  // Cast: the column is written only by this service from a validated body.
  const input = (row.edited ?? row.payload) as SubmissionInput;
  const toSeat = (seat: Seat) => seatView(seat, refs);
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
    sideA: input.sideA.map(toSeat),
    sideB: input.sideB.map(toSeat),
    winnerSide: input.winnerSide,
    scoreA: input.scoreA ?? null,
    scoreB: input.scoreB ?? null,
    scores: input.scores?.length ? input.scores : null,
    bill: input.bill ?? null,
    note: input.note || null,
    date: input.date ?? null,
  };
}

export async function seatRefs(): Promise<Map<number, SeatView>> {
  const roster = await listPlayers({ includeInactive: true });
  return new Map<number, SeatView>(roster.map((p) => [p.id, toPlayerRef(p)]));
}

export function seatView(seat: Seat, refs: Map<number, SeatView>): SeatView {
  return "guestName" in seat
    ? { name: seat.guestName, guest: true, isNew: true }
    : (refs.get(seat.playerId) ?? { ...GUEST_SEAT, id: seat.playerId, name: "?" });
}

async function viewsOf(rows: MatchSubmissionRow[]): Promise<SubmissionView[]> {
  if (rows.length === 0) return [];
  const refs = await seatRefs();
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
