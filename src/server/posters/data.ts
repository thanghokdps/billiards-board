import "server-only";

import { periodStart } from "@/lib/domain";
import { computePlayerStats, rivalry, specialReason, type SpecialReason, type StatPlayer } from "@/lib/stats";
import type { MatchView } from "@/server/matches/schema";
import { loadBoard } from "@/server/stats/service";

import { avatarSrc } from "./assets";

export type PosterPlayer = StatPlayer & { avatar: string | null };

async function withAvatars(players: StatPlayer[]): Promise<PosterPlayer[]> {
  return Promise.all(players.map(async (p) => ({ ...p, avatar: await avatarSrc(p.avatarUrl) })));
}

export interface MatchPosterData {
  match: MatchView;
  sideA: PosterPlayer[];
  sideB: PosterPlayer[];
  reason: SpecialReason | null;
}

export async function matchPosterData(id: string): Promise<MatchPosterData | null> {
  const { all } = await loadBoard();
  const index = all.findIndex((m) => m.id === id);
  const match = all[index];
  if (!match) return null;
  const [sideA, sideB] = await Promise.all([withAvatars(match.sideA), withAvatars(match.sideB)]);
  return { match, sideA, sideB, reason: specialReason(match, all.slice(0, index)) };
}

export interface WantedPosterData {
  player: PosterPlayer;
  lossStreak: number;
  bounty: number;
}

/** Any player can be put on a poster on request; the bounty is what they paid this month. */
export async function wantedPosterData(slug: string): Promise<WantedPosterData | null> {
  const { today, players, all } = await loadBoard();
  const player = players.find((p) => p.slug === slug);
  if (!player) return null;
  const monthStart = periodStart("month", today)!;
  const [overall] = computePlayerStats([player], all);
  const [month] = computePlayerStats(
    [player],
    all.filter((m) => m.date >= monthStart),
  );
  const [withAvatar] = await withAvatars([player]);
  return {
    player: withAvatar!,
    lossStreak: overall?.current?.result === "L" ? overall.current.length : 0,
    bounty: month?.paid ?? 0,
  };
}

export interface RivalryPosterData {
  a: PosterPlayer;
  b: PosterPlayer;
  aWins: number;
  bWins: number;
  played: number;
}

export async function rivalryPosterData(): Promise<RivalryPosterData | null> {
  const { players, all } = await loadBoard();
  const h = rivalry(players, all);
  if (!h) return null;
  const [a, b] = await withAvatars([h.a, h.b]);
  return { a: a!, b: b!, aWins: h.aWins, bWins: h.bWins, played: h.played };
}
