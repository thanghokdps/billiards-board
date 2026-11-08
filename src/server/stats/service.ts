import "server-only";

import { cache } from "react";

import { localDate, periodStart, type GameType, type Period } from "@/lib/domain";
import {
  achievements,
  computeElo,
  computePlayerStats,
  headToHeadMatrix,
  money,
  nemesisAndPrey,
  records,
  rivalry,
  specialReason,
  wanted,
  type StatMatch,
} from "@/lib/stats";
import { findMatches } from "@/server/matches/repository";
import { listPlayers, toPlayerRef } from "@/server/players/repository";

export interface StatsFilter {
  period?: Period;
  gameType?: GameType | null;
  today?: string;
}

/** One load of players + matches per request; every page derives from it. */
export const loadBoard = cache(async (period: Period = "all", gameType: GameType | null = null) => {
  const today = localDate(new Date());
  const [roster, guestRows, all] = await Promise.all([
    listPlayers({ guests: "exclude" }),
    listPlayers({ guests: "only" }),
    findMatches({}),
  ]);
  const players = roster.map(toPlayerRef);
  const guests = guestRows.map(toPlayerRef);
  const from = periodStart(period, today);
  const filtered = all.filter((m) => (!from || m.date >= from) && (!gameType || m.gameType === gameType));
  return { today, roster, players, guests, all, matches: filtered };
});

export async function getOverview(filter: StatsFilter = {}) {
  const { today, players, guests, all, matches } = await loadBoard(filter.period ?? "all", filter.gameType ?? null);
  const stats = computePlayerStats(players, matches);
  const monthStart = periodStart("month", today)!;
  const monthMatches = all.filter((m) => m.date >= monthStart);
  return {
    today,
    players,
    stats,
    matrix: headToHeadMatrix(players, matches),
    records: records(matches),
    money: money(players, matches, guests),
    achievements: achievements(computePlayerStats(players, all), all),
    wanted: wanted(computePlayerStats(players, all), monthMatches, players),
    rivalry: rivalry(players, all),
    elo: computeElo(filter.gameType ? all.filter((m) => m.gameType === filter.gameType) : all),
    matchCount: matches.length,
  };
}

export async function getToday() {
  const { today, players, all } = await loadBoard();
  const todays = all.filter((m) => m.date === today);
  const lastDate = all.at(-1)?.date ?? null;
  const shownDate = todays.length ? today : lastDate;
  const shown = shownDate ? all.filter((m) => m.date === shownDate) : [];
  const stats = computePlayerStats(players, all);
  return {
    today,
    shownDate,
    isToday: shownDate === today,
    matches: [...shown].reverse(),
    totalBill: shown.reduce((s, m) => s + (m.bill ?? 0), 0),
    stats,
    specials: Object.fromEntries(
      shown.map(
        (m) =>
          [
            m.id,
            specialReason(
              m,
              all.filter((x) => x.playedAt < m.playedAt),
            ),
          ] as const,
      ),
    ),
  };
}

export async function getPlayerProfile(slug: string) {
  const { players, all } = await loadBoard();
  const player = players.find((p) => p.slug === slug);
  if (!player) return null;
  const stats = computePlayerStats(players, all);
  const mine = stats.find((s) => s.player.id === player.id)!;
  const elo = computeElo(all);
  return {
    player,
    stats: mine,
    rank: [...stats].sort((a, b) => b.elo - a.elo).findIndex((s) => s.player.id === player.id) + 1,
    rivals: nemesisAndPrey(player, players, all),
    badges: achievements(stats, all)[player.id] ?? [],
    eloHistory: elo.history
      .map((h) => ({ date: h.date, elo: h.ratings[player.id] ?? null }))
      .filter((h) => h.elo !== null),
    recent: all
      .filter((m) => [...m.sideA, ...m.sideB].some((p) => p.id === player.id))
      .slice(-12)
      .reverse(),
    players,
  };
}

export async function getHistory(options: { gameType?: GameType | null; period?: Period }) {
  const { matches } = await loadBoard(options.period ?? "all", options.gameType ?? null);
  const byDate = new Map<string, StatMatch[]>();
  for (const m of [...matches].reverse()) {
    const list = byDate.get(m.date) ?? [];
    list.push(m);
    byDate.set(m.date, list);
  }
  return [...byDate.entries()].map(([date, list]) => ({
    date,
    matches: list,
    bill: list.reduce((s, m) => s + (m.bill ?? 0), 0),
  }));
}

export async function getHallOfFame() {
  const { players, all } = await loadBoard();
  const posters = all
    .map((m, i) => ({ match: m, reason: specialReason(m, all.slice(0, i)) }))
    .filter((x) => x.reason !== null)
    .reverse()
    .slice(0, 12);
  const stats = computePlayerStats(players, all);
  return { records: records(all), posters, stats, achievements: achievements(stats, all), players };
}
