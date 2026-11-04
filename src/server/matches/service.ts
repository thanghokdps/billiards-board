import "server-only";

import { eq, like } from "drizzle-orm";

import { db } from "@/db/client";
import { matches, matchPlayers } from "@/db/schema";
import { localDate } from "@/lib/domain";
import { specialReason } from "@/lib/stats";
import { recordAudit } from "@/server/audit/repository";
import { recordEvents, type MatchEvent } from "@/server/events/repository";
import { HttpError } from "@/server/http";
import { settleFor } from "@/server/predictions/repository";

import { findMatchById, findMatches, getOrCreateSession, type Tx } from "./repository";
import { matchInputSchema, type MatchInput, type MatchPatch, type MatchView } from "./schema";

interface Actor {
  actor: string;
  via: "chat" | "ui";
}

/** Matches played "now" for a past date get a midday timestamp on that date, so ordering stays sensible. */
function playedAtFor(date: string, now: Date): Date {
  return date === localDate(now) ? now : new Date(`${date}T05:30:00Z`);
}

async function insertOne(tx: Tx, input: MatchInput, now: Date, clientKey: string | null): Promise<string> {
  const date = input.date ?? localDate(now);
  const sessionId = await getOrCreateSession(date, tx);
  const [row] = await tx
    .insert(matches)
    .values({
      sessionId,
      playedAt: playedAtFor(date, now),
      gameType: input.gameType,
      format: input.format,
      scoreA: input.scoreA ?? null,
      scoreB: input.scoreB ?? null,
      winnerSide: input.winnerSide,
      bill: input.bill ?? null,
      note: input.note ?? null,
      tags: input.tags ?? [],
      clientKey,
    })
    .returning({ id: matches.id });
  if (!row) throw new Error("insert returned no row");
  await tx
    .insert(matchPlayers)
    .values([
      ...input.sideA.map((playerId) => ({ matchId: row.id, playerId, side: "a" as const })),
      ...input.sideB.map((playerId) => ({ matchId: row.id, playerId, side: "b" as const })),
    ]);
  return row.id;
}

export interface CreatedMatches {
  matches: MatchView[];
  /** Special moments the UI celebrates (STREAK BROKEN poster, confetti). */
  events: MatchEvent[];
}

/**
 * Creates one or more matches in one transaction, each with its audit entry. Special matches get an
 * `events` row, and open predictions on the same players are settled in the same transaction.
 */
export async function createMatches(
  inputs: MatchInput[],
  who: Actor,
  options: { now?: Date; idempotencyKey?: string } = {},
): Promise<CreatedMatches> {
  const key = options.idempotencyKey;
  if (key) {
    const replay = await findByClientKey(key);
    if (replay.length > 0) return { matches: replay, events: [] };
  }
  try {
    return await insertBatch(inputs, who, options.now ?? new Date(), key);
  } catch (error) {
    // A concurrent double submit lost the race on the unique key: return what the winner wrote.
    if (key && isUniqueViolation(error)) return { matches: await findByClientKey(key), events: [] };
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined;
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}

async function findByClientKey(key: string): Promise<MatchView[]> {
  const rows = await db
    .select({ id: matches.id })
    .from(matches)
    .where(like(matches.clientKey, `${key}:%`));
  if (rows.length === 0) return [];
  return findMatches({ ids: rows.map((r) => r.id) });
}

async function insertBatch(
  inputs: MatchInput[],
  who: Actor,
  now: Date,
  key: string | undefined,
): Promise<CreatedMatches> {
  return db.transaction(async (tx) => {
    const history = await findMatches({}, tx);
    const created: MatchView[] = [];
    const moments: MatchEvent[] = [];
    for (const [index, input] of inputs.entries()) {
      // Batch entries keep their order: each one is a second later than the previous.
      const id = await insertOne(tx, input, new Date(now.getTime() + index * 1000), key ? `${key}:${index}` : null);
      const view = await findMatchById(id, tx);
      if (!view) throw new Error("created match not found");
      await recordAudit(tx, { ...who, action: "create", entity: "match", entityId: id, after: view });
      const reason = specialReason(
        view,
        history.filter((m) => m.playedAt < view.playedAt),
      );
      if (reason) moments.push({ type: reason, matchId: id });
      await settleFor(tx, {
        id,
        date: view.date,
        sideA: input.sideA,
        sideB: input.sideB,
        winnerSide: input.winnerSide,
      });
      history.push(view);
      created.push(view);
    }
    await recordEvents(tx, moments);
    return { matches: created, events: moments };
  });
}

export async function updateMatch(id: string, patch: MatchPatch, who: Actor): Promise<MatchView> {
  return db.transaction(async (tx) => {
    const before = await findMatchById(id, tx);
    if (!before || before.deleted) throw new HttpError("not_found");
    const merged = {
      gameType: patch.gameType ?? before.gameType,
      format: patch.format ?? before.format,
      sideA: patch.sideA ?? before.sideA.map((p) => p.id),
      sideB: patch.sideB ?? before.sideB.map((p) => p.id),
      winnerSide: patch.winnerSide ?? before.winnerSide,
      scoreA: patch.scoreA === undefined ? before.scoreA : patch.scoreA,
      scoreB: patch.scoreB === undefined ? before.scoreB : patch.scoreB,
      bill: patch.bill === undefined ? before.bill : patch.bill,
      note: patch.note === undefined ? before.note : patch.note,
      tags: patch.tags ?? before.tags,
      date: before.date,
    };
    const valid = matchInputSchema.safeParse(merged);
    if (!valid.success) throw new HttpError("invalid_body", valid.error.issues.map((i) => i.message).join("; "));

    await tx
      .update(matches)
      .set({
        gameType: merged.gameType,
        format: merged.format,
        winnerSide: merged.winnerSide,
        scoreA: merged.scoreA,
        scoreB: merged.scoreB,
        bill: merged.bill,
        note: merged.note,
        tags: merged.tags,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id));
    if (patch.sideA || patch.sideB || patch.format) {
      await tx.delete(matchPlayers).where(eq(matchPlayers.matchId, id));
      await tx
        .insert(matchPlayers)
        .values([
          ...merged.sideA.map((playerId) => ({ matchId: id, playerId, side: "a" as const })),
          ...merged.sideB.map((playerId) => ({ matchId: id, playerId, side: "b" as const })),
        ]);
    }
    const after = await findMatchById(id, tx);
    if (!after) throw new Error("updated match not found");
    await recordAudit(tx, { ...who, action: "update", entity: "match", entityId: id, before, after });
    return after;
  });
}

/** Soft delete, so an undo (restore) can bring it back and the audit log keeps the history. */
export async function deleteMatch(id: string, who: Actor): Promise<MatchView> {
  return db.transaction(async (tx) => {
    const before = await findMatchById(id, tx);
    if (!before || before.deleted) throw new HttpError("not_found");
    await tx.update(matches).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(matches.id, id));
    await recordAudit(tx, { ...who, action: "delete", entity: "match", entityId: id, before });
    return before;
  });
}

export async function restoreMatch(id: string, who: Actor): Promise<MatchView> {
  return db.transaction(async (tx) => {
    const before = await findMatchById(id, tx);
    if (!before) throw new HttpError("not_found");
    if (!before.deleted) return before;
    await tx.update(matches).set({ deletedAt: null, updatedAt: new Date() }).where(eq(matches.id, id));
    const after = await findMatchById(id, tx);
    await recordAudit(tx, { ...who, action: "restore", entity: "match", entityId: id, before, after });
    if (!after) throw new Error("restored match not found");
    return after;
  });
}
