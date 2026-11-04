import "server-only";

import { GAME_TYPES, type GameType } from "@/lib/domain";
import {
  achievements,
  computePlayerStats,
  money,
  nemesisAndPrey,
  type AchievementId,
  type StatMatch,
  type StatPlayer,
} from "@/lib/stats";

import { loadBoard } from "./service";

const byYear = (matches: StatMatch[], year: number) => matches.filter((m) => m.date.startsWith(`${year}-`));
const involves = (m: StatMatch, playerId: number) => [...m.sideA, ...m.sideB].some((p) => p.id === playerId);

/** `?year=` as a plain 4-digit year, or `fallback` for anything else. */
export function parseWrappedYear(raw: string | undefined, fallback: number): number {
  return raw && /^20\d{2}$/.test(raw) ? Number(raw) : fallback;
}

export interface WrappedIndex {
  year: number;
  /** Years with at least one match, newest first; always includes the current year. */
  years: number[];
  players: { player: StatPlayer; played: number; winRate: number }[];
}

export async function getWrappedIndex(rawYear: string | undefined): Promise<WrappedIndex> {
  const { today, players, all } = await loadBoard();
  const currentYear = Number(today.slice(0, 4));
  const year = parseWrappedYear(rawYear, currentYear);
  const years = [...new Set([currentYear, ...all.map((m) => Number(m.date.slice(0, 4)))])].sort((a, b) => b - a);
  const stats = computePlayerStats(players, byYear(all, year));
  return {
    year,
    years,
    players: stats
      .filter((s) => s.played > 0)
      .sort((a, b) => b.played - a.played)
      .map((s) => ({ player: s.player, played: s.played, winRate: s.winRate })),
  };
}

export interface WrappedStory {
  year: number;
  player: StatPlayer & { catchphrase: string | null };
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  sessions: number;
  favourite: { gameType: GameType; played: number; winRate: number } | null;
  longestWinStreak: number;
  nemesis: { player: StatPlayer; losses: number; played: number } | null;
  prey: { player: StatPlayer; wins: number; played: number } | null;
  paid: number;
  /** 1 = paid the most in the group this year. */
  paidRank: number;
  payers: number;
  topCollector: { player: StatPlayer; amount: number } | null;
  bestDay: { date: string; wins: number; played: number } | null;
  badges: AchievementId[];
}

function bestDayOf(mine: StatMatch[], playerId: number): WrappedStory["bestDay"] {
  const days = new Map<string, { wins: number; played: number }>();
  for (const m of mine) {
    const onA = m.sideA.some((p) => p.id === playerId);
    const day = days.get(m.date) ?? { wins: 0, played: 0 };
    day.played += 1;
    if ((m.winnerSide === "a") === onA) day.wins += 1;
    days.set(m.date, day);
  }
  // Most wins, then the cleaner day (fewest losses), then the later date.
  const best = [...days.entries()].sort(
    (a, b) => b[1].wins - a[1].wins || a[1].played - a[1].wins - (b[1].played - b[1].wins) || b[0].localeCompare(a[0]),
  )[0];
  return best && best[1].wins > 0 ? { date: best[0], ...best[1] } : null;
}

function favouriteOf(byGameType: Record<GameType, { played: number; winRate: number }>): WrappedStory["favourite"] {
  const best = GAME_TYPES.map((gameType) => ({ gameType, ...byGameType[gameType] }))
    .filter((g) => g.played > 0)
    .sort((a, b) => b.played - a.played || b.winRate - a.winRate)[0];
  return best ?? null;
}

/** The year-in-review of one player, or null when the slug is unknown. A year without matches gives `played: 0`. */
export async function getWrappedStory(slug: string, rawYear: string | undefined): Promise<WrappedStory | null> {
  const { today, players, roster, all } = await loadBoard();
  const player = players.find((p) => p.slug === slug);
  if (!player) return null;
  const year = parseWrappedYear(rawYear, Number(today.slice(0, 4)));
  const matches = byYear(all, year);
  const stats = computePlayerStats(players, matches);
  const mine = stats.find((s) => s.player.id === player.id)!;
  const payers = money(players, matches).byPlayer.filter((p) => p.paid > 0);
  const paidRank = payers.findIndex((p) => p.player.id === player.id) + 1;
  const { nemesis, prey } = nemesisAndPrey(player, players, matches);
  return {
    year,
    player: { ...player, catchphrase: roster.find((p) => p.id === player.id)?.catchphrase ?? null },
    played: mine.played,
    wins: mine.wins,
    losses: mine.losses,
    winRate: mine.winRate,
    sessions: mine.sessionsAttended,
    favourite: favouriteOf(mine.byGameType),
    longestWinStreak: mine.longestWinStreak,
    nemesis,
    prey,
    paid: mine.paid,
    paidRank,
    payers: payers.length,
    topCollector: mine.topCollector,
    bestDay: bestDayOf(
      matches.filter((m) => involves(m, player.id)),
      player.id,
    ),
    badges: achievements(stats, matches)[player.id] ?? [],
  };
}
