import { money, type PlayerStats, type StatMatch } from "@/lib/stats";

import type { TvData, TvStreakRow } from "../types";

const MIN_STREAK = 2;
const HOT_LIMIT = 5;
const COLD_LIMIT = 3;
const TOP_LIMIT = 5;
const PAYER_LIMIT = 3;

interface TodayInput {
  shownDate: string | null;
  isToday: boolean;
  matches: StatMatch[];
  stats: PlayerStats[];
}

function streakRows(stats: PlayerStats[], result: "W" | "L", limit: number): TvStreakRow[] {
  return stats
    .flatMap((s) =>
      s.current?.result === result && s.current.length >= MIN_STREAK ? [{ player: s.player, streak: s.current }] : [],
    )
    .sort((a, b) => b.streak.length - a.streak.length)
    .slice(0, limit);
}

/** Pure: turns the day's matches and the all-time stats into the four boards. */
export function buildTvData({ shownDate, isToday, matches, stats }: TodayInput): TvData {
  const bill = money(
    stats.map((s) => s.player),
    matches,
  );
  return {
    shownDate,
    isToday,
    matches,
    hot: streakRows(stats, "W", HOT_LIMIT),
    cold: streakRows(stats, "L", COLD_LIMIT),
    top: stats
      .filter((s) => s.played > 0)
      .sort((a, b) => b.elo - a.elo)
      .slice(0, TOP_LIMIT)
      .map((s, i) => ({
        rank: i + 1,
        player: s.player,
        wins: s.wins,
        losses: s.losses,
        winRate: s.winRate,
        elo: s.elo,
        streak: s.current,
      })),
    bill: {
      total: bill.total,
      matchCount: matches.length,
      average: bill.avgPerMatch,
      payers: bill.byPlayer.filter((p) => p.paid > 0).slice(0, PAYER_LIMIT),
    },
  };
}
