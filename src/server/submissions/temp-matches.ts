import "server-only";

import { db } from "@/db/client";
import type { MatchSubmissionRow } from "@/db/schema";
import { recordAudit } from "@/server/audit/repository";
import type { SignedInPlayer } from "@/server/auth/player-session";
import { HttpError } from "@/server/http";
import { listPlayers } from "@/server/players/repository";

import { getById, insertTemp, listBoardRows, listScheduled, lockTempMatches, updateTemp } from "./repository";
import type { ScheduleInput, SubmissionInput, TempMatchDetail, TempMatchView, TempStatus } from "./schema";
import { invalidIssues, rosterIssues, seatRefs, seatsOf, seatView, type Seat } from "./service";

/** Member ids in a set of seats (typed guests have none). */
function memberIds(input: Pick<SubmissionInput, "sideA" | "sideB">): number[] {
  return seatsOf(input).flatMap(({ seat }) => ("playerId" in seat ? [seat.playerId] : []));
}

/** The stored body: a schedule while `scheduled`, the full input once `pending`. Written only from validated bodies. */
function bodyOf(row: MatchSubmissionRow): ScheduleInput | SubmissionInput {
  // Cast: payload is written only by this module and approve, from parsed bodies.
  return row.payload as ScheduleInput | SubmissionInput;
}

const isTemp = (status: string): status is TempStatus => status === "scheduled" || status === "pending";

/** Loads a temp match the caller sits in; any other row (not theirs, finished, malformed id) is a 404. */
async function loadOwn(id: string, caller: SignedInPlayer): Promise<MatchSubmissionRow> {
  const row = await getById(id);
  if (!row || !isTemp(row.status) || !memberIds(bodyOf(row)).includes(caller.player.id)) {
    throw new HttpError("not_found");
  }
  return row;
}

/** The caller must stay in the match they create or change. */
function requireSeated(input: Pick<SubmissionInput, "sideA" | "sideB">, caller: SignedInPlayer): void {
  if (memberIds(input).includes(caller.player.id)) return;
  throw invalidIssues([{ path: ["sideA"], message: "you must be one of the players" }]);
}

async function checkRoster(input: SubmissionInput): Promise<void> {
  const issues = rosterIssues(input, await listPlayers());
  if (issues.length > 0) throw invalidIssues(issues);
}

/** One unplayed match per member: none of `ids` may sit in another `scheduled` row. Call under the temp lock. */
async function requireFree(ids: number[], except: string | null, tx: Parameters<typeof lockTempMatches>[0]) {
  const open = await listScheduled(tx);
  const busy = open.some((row) => row.id !== except && memberIds(bodyOf(row)).some((id) => ids.includes(id)));
  if (busy) throw new HttpError("busy");
}

const auditShape = (row: MatchSubmissionRow) => ({
  status: row.status,
  scheduledAt: row.scheduledAt,
  input: row.payload,
});

/** A schedule probed as a full input, so the roster checks (which want a winner) can run before the result. */
const probe = (schedule: ScheduleInput): SubmissionInput => ({ ...schedule, winnerSide: "a" });

const toDate = (iso: string | null | undefined): Date | null => (iso ? new Date(iso) : null);

export async function createTemp(caller: SignedInPlayer, schedule: ScheduleInput): Promise<TempMatchView> {
  requireSeated(schedule, caller);
  await checkRoster(probe(schedule));
  const row = await db.transaction(async (tx) => {
    await lockTempMatches(tx);
    await requireFree(memberIds(schedule), null, tx);
    const created = await insertTemp(
      {
        payload: schedule,
        submitter: caller.player.name,
        createdBy: caller.player.id,
        scheduledAt: toDate(schedule.scheduledAt),
      },
      tx,
    );
    await recordAudit(tx, {
      actor: caller.actor,
      via: "ui",
      action: "create",
      entity: "submission",
      entityId: created.id,
      before: null,
      after: auditShape(created),
    });
    return created;
  });
  return (await boardViews([row]))[0]!;
}

/** Players, format or time of an unplayed match. */
export async function editSchedule(
  caller: SignedInPlayer,
  id: string,
  schedule: ScheduleInput,
): Promise<TempMatchView> {
  const before = await loadOwn(id, caller);
  if (before.status !== "scheduled") throw new HttpError("conflict");
  requireSeated(schedule, caller);
  await checkRoster(probe(schedule));
  const row = await db.transaction(async (tx) => {
    await lockTempMatches(tx);
    await requireFree(memberIds(schedule), id, tx);
    const updated = await updateTemp(
      id,
      ["scheduled"],
      { payload: schedule, scheduledAt: toDate(schedule.scheduledAt) },
      tx,
    );
    if (!updated) throw new HttpError("conflict");
    await recordAudit(tx, {
      actor: caller.actor,
      via: "ui",
      action: "update",
      entity: "submission",
      entityId: id,
      before: auditShape(before),
      after: auditShape(updated),
    });
    return updated;
  });
  return (await boardViews([row]))[0]!;
}

/** First result (`scheduled` → `pending`) or a fix to it while the admin has not decided. */
export async function enterResult(caller: SignedInPlayer, id: string, input: SubmissionInput): Promise<TempMatchView> {
  const before = await loadOwn(id, caller);
  requireSeated(input, caller);
  await checkRoster(input);
  const row = await db.transaction(async (tx) => {
    const updated = await updateTemp(id, ["scheduled", "pending"], { payload: input, status: "pending" }, tx);
    if (!updated) throw new HttpError("conflict");
    await recordAudit(tx, {
      actor: caller.actor,
      via: "ui",
      action: "update",
      entity: "submission",
      entityId: id,
      before: auditShape(before),
      after: auditShape(updated),
    });
    return updated;
  });
  return (await boardViews([row]))[0]!;
}

/** Only an unplayed match can be cancelled; one with a result waits for the admin. */
export async function cancelTemp(caller: SignedInPlayer, id: string): Promise<void> {
  const before = await loadOwn(id, caller);
  if (before.status !== "scheduled") throw new HttpError("conflict");
  await db.transaction(async (tx) => {
    const updated = await updateTemp(id, ["scheduled"], { status: "cancelled" }, tx);
    if (!updated) throw new HttpError("conflict");
    await recordAudit(tx, {
      actor: caller.actor,
      via: "ui",
      action: "delete",
      entity: "submission",
      entityId: id,
      before: auditShape(before),
      after: auditShape(updated),
    });
  });
}

export async function getOwnTemp(caller: SignedInPlayer, id: string): Promise<TempMatchDetail> {
  const row = await loadOwn(id, caller);
  const body = bodyOf(row);
  const view = (await boardViews([row]))[0]!;
  const schedule: ScheduleInput = {
    gameType: body.gameType,
    format: body.format,
    sideA: body.sideA,
    sideB: body.sideB,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
  };
  return { view, schedule, input: row.status === "pending" ? (body as SubmissionInput) : null };
}

/** Home's band: everyone sees who plays and, once entered, the result; never the note or who typed it. */
export async function listTempBoard(): Promise<TempMatchView[]> {
  return boardViews(await listBoardRows());
}

async function boardViews(rows: MatchSubmissionRow[]): Promise<TempMatchView[]> {
  if (rows.length === 0) return [];
  const refs = await seatRefs();
  return rows.flatMap((row) => {
    if (!isTemp(row.status)) return [];
    const body = bodyOf(row);
    const toSeat = (seat: Seat) => seatView(seat, refs);
    const result =
      row.status === "pending" && "winnerSide" in body
        ? {
            winnerSide: body.winnerSide,
            scoreA: body.scoreA ?? null,
            scoreB: body.scoreB ?? null,
            scores: body.scores?.length ? body.scores : null,
            bill: body.bill ?? null,
          }
        : null;
    return [
      {
        id: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
        gameType: body.gameType,
        format: body.format,
        sideA: body.sideA.map(toSeat),
        sideB: body.sideB.map(toSeat),
        seatedIds: memberIds(body),
        result,
      },
    ];
  });
}
