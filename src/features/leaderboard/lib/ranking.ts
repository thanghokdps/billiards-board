import type { PlayerStats } from "@/lib/stats";

/** A win rate over fewer games than this is not ranked on rate alone. */
export const MIN_RANKED_GAMES = 3;

const byRate = (a: PlayerStats, b: PlayerStats) => b.winRate - a.winRate || b.wins - a.wins || b.played - a.played;

/**
 * Win rate (with at least MIN_RANKED_GAMES games) first, then the players who have not played enough,
 * by most wins, then the players with no game at all.
 */
export function rankPlayers(stats: PlayerStats[]): PlayerStats[] {
  const played = stats.filter((s) => s.played > 0);
  const qualified = played.filter((s) => s.played >= MIN_RANKED_GAMES).sort(byRate);
  const rest = played.filter((s) => s.played < MIN_RANKED_GAMES).sort((a, b) => b.wins - a.wins || byRate(a, b));
  return [...qualified, ...rest, ...stats.filter((s) => s.played === 0)];
}
