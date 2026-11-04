import { computeElo, ELO_START, type StatMatch, type StatPlayer } from "@/lib/stats";

/** One card attribute: 0–99, or null with no qualifying game; `games` is the sample behind it. */
export interface CardAttribute {
  value: number | null;
  games: number;
}

export interface CardStats {
  overall: number;
  accuracy: CardAttribute;
  nerve: CardAttribute;
  luck: CardAttribute;
}

/** A game this close (margin up to a quarter of the winning score) counts as "close". */
export const CLOSE_MARGIN = 0.25;
export const OVERALL_BASE = 60;
export const OVERALL_ELO_PER_POINT = 5;

const toRating = (ratio: number) => Math.min(99, Math.round(ratio * 100));
const average = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;
const attribute = (values: number[]): CardAttribute => ({
  value: values.length ? toRating(average(values)) : null,
  games: values.length,
});

/**
 * Card numbers from real matches (chronological), for one player:
 * - overall: 60 + (Elo − 1200) ÷ 5, kept within 1–99;
 * - accuracy: average share of the points in scored games that were this player's;
 * - nerve: win rate in close games (margin ≤ 25 % of the winning score) and #comeback games;
 * - luck: win rate against the side whose average Elo, before the match, was higher.
 */
export function cardStats(player: StatPlayer, elo: number, matches: StatMatch[]): CardStats {
  const { history } = computeElo(matches);
  const accuracy: number[] = [];
  const nerve: number[] = [];
  const luck: number[] = [];

  matches.forEach((m, i) => {
    const onA = m.sideA.some((p) => p.id === player.id);
    if (!onA && !m.sideB.some((p) => p.id === player.id)) return;
    const won = (m.winnerSide === "a") === onA ? 1 : 0;
    const own = onA ? m.scoreA : m.scoreB;
    const other = onA ? m.scoreB : m.scoreA;

    const scored = own != null && other != null && own + other > 0;
    if (scored) accuracy.push(own / (own + other));
    const close = scored && Math.abs(own - other) / Math.max(own, other) <= CLOSE_MARGIN;
    if (close || m.tags.includes("#comeback")) nerve.push(won);

    const before: Record<number, number> = i === 0 ? {} : history[i - 1]!.ratings;
    const meanElo = (side: StatPlayer[]) => average(side.map((p) => before[p.id] ?? ELO_START));
    if (meanElo(onA ? m.sideB : m.sideA) > meanElo(onA ? m.sideA : m.sideB)) luck.push(won);
  });

  return {
    overall: Math.min(99, Math.max(1, Math.round(OVERALL_BASE + (elo - ELO_START) / OVERALL_ELO_PER_POINT))),
    accuracy: attribute(accuracy),
    nerve: attribute(nerve),
    luck: attribute(luck),
  };
}
