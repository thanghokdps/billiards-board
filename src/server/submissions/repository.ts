import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { matchSubmissions, type MatchSubmissionRow, type SubmissionStatus } from "@/db/schema";
import type { Tx } from "@/server/matches/repository";

type Conn = typeof db | Tx;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PENDING_LIMIT = 50;

const BOARD_LIMIT = 30;
/** One key for every temp-match write, so the "one unplayed match per member" check and its write can't interleave. */
const TEMP_LOCK_KEY = 0x616e_6231;

export async function lockTempMatches(tx: Tx): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(${TEMP_LOCK_KEY})`);
}

export async function insertTemp(
  values: { payload: unknown; submitter: string; createdBy: number; scheduledAt: Date | null },
  conn: Conn = db,
): Promise<MatchSubmissionRow> {
  const [row] = await conn
    .insert(matchSubmissions)
    .values({ ...values, status: "scheduled" })
    .returning();
  if (!row) throw new Error("temp match insert returned no row");
  return row;
}

/** Every unplayed temp match; few at a time, so the seat check runs over them in code. */
export async function listScheduled(conn: Conn = db): Promise<MatchSubmissionRow[]> {
  return conn.select().from(matchSubmissions).where(eq(matchSubmissions.status, "scheduled"));
}

/** What Home shows: unplayed and awaiting approval, soonest first. */
export async function listBoardRows(conn: Conn = db): Promise<MatchSubmissionRow[]> {
  return conn
    .select()
    .from(matchSubmissions)
    .where(inArray(matchSubmissions.status, ["scheduled", "pending"]))
    .orderBy(
      asc(sql`coalesce(${matchSubmissions.scheduledAt}, ${matchSubmissions.createdAt})`),
      asc(matchSubmissions.id),
    )
    .limit(BOARD_LIMIT);
}

/** Changes a temp match only while it is still in one of `from`; undefined means it moved on first. */
export async function updateTemp(
  id: string,
  from: SubmissionStatus[],
  set: { status?: SubmissionStatus; payload?: unknown; scheduledAt?: Date | null },
  conn: Conn = db,
): Promise<MatchSubmissionRow | undefined> {
  const [row] = await conn
    .update(matchSubmissions)
    .set(set)
    .where(and(eq(matchSubmissions.id, id), inArray(matchSubmissions.status, from)))
    .returning();
  return row;
}

/** Newest first, capped: the admin works through a short stack. */
export async function listPending(conn: Conn = db): Promise<MatchSubmissionRow[]> {
  return conn
    .select()
    .from(matchSubmissions)
    .where(eq(matchSubmissions.status, "pending"))
    .orderBy(desc(matchSubmissions.createdAt))
    .limit(PENDING_LIMIT);
}

export async function getById(id: string, conn: Conn = db): Promise<MatchSubmissionRow | undefined> {
  if (!UUID.test(id)) return undefined;
  const [row] = await conn.select().from(matchSubmissions).where(eq(matchSubmissions.id, id)).limit(1);
  return row;
}

/** Decides a submission only while it is still pending; undefined means someone else decided first. */
export async function markDecided(
  id: string,
  decision: { status: "approved" | "rejected"; matchId?: string; edited?: unknown },
  conn: Conn = db,
): Promise<MatchSubmissionRow | undefined> {
  const [row] = await conn
    .update(matchSubmissions)
    .set({
      status: decision.status,
      matchId: decision.matchId ?? null,
      edited: decision.edited ?? null,
      decidedAt: new Date(),
    })
    .where(and(eq(matchSubmissions.id, id), eq(matchSubmissions.status, "pending")))
    .returning();
  return row;
}
