import "server-only";

import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { matches, matchPlayers, players, sessions, type GameType } from "@/db/schema";

import type { MatchView } from "./schema";
import { toPlayerRef } from "../players/repository";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Conn = typeof db | Tx;

export interface MatchQuery {
  from?: string | null;
  to?: string | null;
  gameType?: GameType | null;
  includeDeleted?: boolean;
  ids?: string[];
  limit?: number;
  order?: "asc" | "desc";
}

/** Matches with their players and session date, as DTOs. Two queries, no N+1. */
export async function findMatches(query: MatchQuery = {}, conn: Conn = db): Promise<MatchView[]> {
  const where = and(
    query.includeDeleted ? undefined : isNull(matches.deletedAt),
    query.from ? gte(sessions.date, query.from) : undefined,
    query.to ? lte(sessions.date, query.to) : undefined,
    query.gameType ? eq(matches.gameType, query.gameType) : undefined,
    query.ids ? inArray(matches.id, query.ids) : undefined,
  );
  const orderBy = query.order === "desc" ? [desc(matches.playedAt)] : [asc(matches.playedAt)];
  const base = conn
    .select({ match: matches, date: sessions.date })
    .from(matches)
    .innerJoin(sessions, eq(matches.sessionId, sessions.id))
    .where(where)
    .orderBy(...orderBy);
  const rows = query.limit ? await base.limit(Math.min(query.limit, 500)) : await base;
  if (rows.length === 0) return [];

  const links = await conn
    .select({ matchId: matchPlayers.matchId, side: matchPlayers.side, score: matchPlayers.score, player: players })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(
      inArray(
        matchPlayers.matchId,
        rows.map((r) => r.match.id),
      ),
    )
    .orderBy(asc(players.ballNumber));

  const byMatch = new Map<string, { a: MatchView["sideA"]; b: MatchView["sideB"]; scores: MatchView["scores"] }>();
  for (const link of links) {
    const entry = byMatch.get(link.matchId) ?? { a: [], b: [], scores: [] };
    entry[link.side].push(toPlayerRef(link.player));
    if (link.score !== null) entry.scores.push({ playerId: link.player.id, score: link.score });
    byMatch.set(link.matchId, entry);
  }

  return rows.map(({ match, date }) => ({
    id: match.id,
    date,
    playedAt: match.playedAt.toISOString(),
    gameType: match.gameType,
    format: match.format,
    sideA: byMatch.get(match.id)?.a ?? [],
    sideB: byMatch.get(match.id)?.b ?? [],
    winnerSide: match.winnerSide,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    scores: byMatch.get(match.id)?.scores ?? [],
    bill: match.bill,
    note: match.note,
    tags: match.tags,
    deleted: match.deletedAt !== null,
  }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findMatchById(id: string, conn: Conn = db): Promise<MatchView | undefined> {
  if (!UUID.test(id)) return undefined;
  const [view] = await findMatches({ ids: [id], includeDeleted: true }, conn);
  return view;
}

export async function getOrCreateSession(date: string, conn: Conn): Promise<number> {
  const [existing] = await conn.select({ id: sessions.id }).from(sessions).where(eq(sessions.date, date)).limit(1);
  if (existing) return existing.id;
  const [created] = await conn
    .insert(sessions)
    .values({ date })
    .onConflictDoNothing({ target: sessions.date })
    .returning({ id: sessions.id });
  if (created) return created.id;
  const [again] = await conn.select({ id: sessions.id }).from(sessions).where(eq(sessions.date, date)).limit(1);
  if (!again) throw new Error("session could not be created");
  return again.id;
}

export async function listSessionDates(conn: Conn = db): Promise<string[]> {
  const rows = await conn.select({ date: sessions.date }).from(sessions).orderBy(desc(sessions.date));
  return rows.map((r) => r.date);
}
