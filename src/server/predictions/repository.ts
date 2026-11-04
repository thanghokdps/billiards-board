import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { predictions, predictionVotes, type Prediction } from "@/db/schema";
import type { GameType, Side } from "@/lib/domain";

import type { Tx } from "../matches/repository";

export interface PredictionView extends Prediction {
  votes: { voterId: number; pick: Side }[];
}

async function withVotes(rows: Prediction[]): Promise<PredictionView[]> {
  if (rows.length === 0) return [];
  const votes = await db
    .select()
    .from(predictionVotes)
    .where(
      inArray(
        predictionVotes.predictionId,
        rows.map((r) => r.id),
      ),
    );
  return rows.map((r) => ({
    ...r,
    votes: votes.filter((v) => v.predictionId === r.id).map((v) => ({ voterId: v.voterId, pick: v.pick })),
  }));
}

export async function listPredictions(limit = 50): Promise<PredictionView[]> {
  const rows = await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(Math.min(limit, 200));
  return withVotes(rows);
}

/** Per voter: picks that matched the real winner / all picks on settled predictions ("nhà tiên tri"). */
export async function getOracleTally(): Promise<{ voterId: number; correct: number; total: number }[]> {
  return db
    .select({
      voterId: predictionVotes.voterId,
      correct: sql<number>`(count(*) filter (where ${predictionVotes.pick} = ${predictions.winnerSide}))::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(predictionVotes)
    .innerJoin(predictions, eq(predictionVotes.predictionId, predictions.id))
    .where(eq(predictions.status, "settled"))
    .groupBy(predictionVotes.voterId);
}

export async function createPrediction(input: {
  date: string;
  gameType: GameType | null;
  sideA: number[];
  sideB: number[];
}): Promise<Prediction> {
  const [row] = await db.insert(predictions).values(input).returning();
  if (!row) throw new Error("prediction insert returned no row");
  return row;
}

/** Upsert: a voter has one pick per prediction; only open predictions take votes. */
export async function castVote(predictionId: number, voterId: number, pick: Side): Promise<boolean> {
  const [open] = await db
    .select({ id: predictions.id })
    .from(predictions)
    .where(and(eq(predictions.id, predictionId), eq(predictions.status, "open")))
    .limit(1);
  if (!open) return false;
  await db
    .insert(predictionVotes)
    .values({ predictionId, voterId, pick })
    .onConflictDoUpdate({ target: [predictionVotes.predictionId, predictionVotes.voterId], set: { pick } });
  return true;
}

export async function cancelPrediction(id: number): Promise<boolean> {
  const rows = await db
    .update(predictions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(predictions.id, id), eq(predictions.status, "open")))
    .returning({ id: predictions.id });
  return rows.length > 0;
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Settles the open predictions of `date` whose sides match the recorded match (either orientation). */
export async function settleFor(
  tx: Tx,
  match: { id: string; date: string; sideA: number[]; sideB: number[]; winnerSide: Side },
): Promise<void> {
  const open = await tx
    .select()
    .from(predictions)
    .where(and(eq(predictions.date, match.date), eq(predictions.status, "open")));
  for (const p of open) {
    const straight = sameSet(p.sideA, match.sideA) && sameSet(p.sideB, match.sideB);
    const flipped = sameSet(p.sideA, match.sideB) && sameSet(p.sideB, match.sideA);
    if (!straight && !flipped) continue;
    const winnerSide: Side = straight ? match.winnerSide : match.winnerSide === "a" ? "b" : "a";
    await tx
      .update(predictions)
      .set({ status: "settled", matchId: match.id, winnerSide, updatedAt: new Date() })
      .where(and(eq(predictions.id, p.id), eq(predictions.status, "open")));
  }
}
