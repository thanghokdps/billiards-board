import "server-only";

import { and, count, desc, eq, gte, min } from "drizzle-orm";

import { db } from "@/db/client";
import { matchSubmissions, type MatchSubmissionRow } from "@/db/schema";
import type { Tx } from "@/server/matches/repository";

type Conn = typeof db | Tx;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PENDING_LIMIT = 50;

export async function insertSubmission(
  values: { payload: unknown; submitter: string | null; ipHash: string },
  conn: Conn = db,
): Promise<MatchSubmissionRow> {
  const [row] = await conn.insert(matchSubmissions).values(values).returning();
  if (!row) throw new Error("submission insert returned no row");
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

/** Rows this client sent since `since`, and when the oldest was sent (null when none). */
export async function countRecentByIpHash(
  ipHash: string,
  since: Date,
  conn: Conn = db,
): Promise<{ count: number; oldest: Date | null }> {
  const [row] = await conn
    .select({ count: count(), oldest: min(matchSubmissions.createdAt) })
    .from(matchSubmissions)
    .where(and(eq(matchSubmissions.ipHash, ipHash), gte(matchSubmissions.createdAt, since)));
  return { count: row?.count ?? 0, oldest: row?.oldest ?? null };
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
