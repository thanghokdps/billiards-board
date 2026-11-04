import type { PlayerStats } from "@/lib/stats";

export const POCKET_METRICS = ["winRate", "avgPoints", "streak", "paid", "bestWin", "bestLoss"] as const;
export type PocketMetric = (typeof POCKET_METRICS)[number];

export interface Point {
  x: number;
  y: number;
}

/** A pocket, in % of the felt, and the far point its balls line up towards. `label` offsets its name from the hole. */
export interface PocketLine {
  from: Point;
  to: Point;
  label: string;
}

const TOP_LEFT = "translate(1.25rem, 0.4rem)";
const TOP_RIGHT = "translate(calc(-100% - 1.25rem), 0.4rem)";
const BOTTOM_LEFT = "translate(1.25rem, calc(-100% - 0.4rem))";
const BOTTOM_RIGHT = "translate(calc(-100% - 1.25rem), calc(-100% - 0.4rem))";
// Clear of the first ball, which rests right beside a side pocket.
const SIDE_LEFT = "translate(0.35rem, calc(-100% - 1.85rem))";
const SIDE_RIGHT = "translate(calc(-100% - 0.35rem), calc(-100% - 1.85rem))";

const line = (x: number, y: number, toX: number, toY: number, label: string): PocketLine => ({
  from: { x, y },
  to: { x: toX, y: toY },
  label,
});

/** The felt stands upright on a phone, so its middle pockets sit on the long sides there and on top and bottom on desktop. */
export const POCKETS: Record<PocketMetric, { tall: PocketLine; wide: PocketLine }> = {
  winRate: { tall: line(0, 0, 100, 100, TOP_LEFT), wide: line(0, 0, 100, 100, TOP_LEFT) },
  avgPoints: { tall: line(100, 0, 0, 100, TOP_RIGHT), wide: line(50, 0, 50, 100, TOP_LEFT) },
  streak: { tall: line(0, 50, 100, 50, SIDE_LEFT), wide: line(100, 0, 0, 100, TOP_RIGHT) },
  paid: { tall: line(100, 50, 0, 50, SIDE_RIGHT), wide: line(0, 100, 100, 0, BOTTOM_LEFT) },
  bestWin: { tall: line(0, 100, 100, 0, BOTTOM_LEFT), wide: line(50, 100, 50, 0, BOTTOM_LEFT) },
  bestLoss: { tall: line(100, 100, 0, 0, BOTTOM_RIGHT), wide: line(100, 100, 0, 0, BOTTOM_RIGHT) },
};

// Clear of the pocket's name, which the tilted table squeezes towards the ball.
const NEAREST = 0.2;
const FARTHEST = 0.86;

/** Where a ball rests on the line: the leader by the pocket, the last one by the far end. */
export function ballPoint({ from, to }: PocketLine, rank: number, count: number): Point {
  const t = count > 1 ? NEAREST + ((FARTHEST - NEAREST) * rank) / (count - 1) : NEAREST;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** The triangle the balls sit in before the break, one more ball per row. */
export function rackPoint(index: number, spacing: Point): Point {
  const row = Math.floor((Math.sqrt(8 * index + 1) - 1) / 2);
  const inRow = index - (row * (row + 1)) / 2;
  return { x: 42 + row * spacing.x, y: 50 + (inRow - row / 2) * spacing.y };
}

/** A ball's name and value: beside it, or under it when the balls line up across the short side. */
export function tagPlacement({ from, to }: PocketLine, ball: Point): { transform: string; align: string } {
  if (from.y === to.y) return { transform: "translate(-50%, 1.75rem)", align: "center" };
  if (ball.x < 62) return { transform: "translate(1.85rem, -50%)", align: "left" };
  return { transform: "translate(calc(-100% - 1.85rem), -50%)", align: "right" };
}

function metricValue(s: PlayerStats, metric: PocketMetric): number | null {
  switch (metric) {
    case "winRate":
      return s.winRate;
    case "avgPoints":
      return s.avgPoints;
    case "streak":
      return s.current ? s.current.length * (s.current.result === "W" ? 1 : -1) : 0;
    case "paid":
      return s.paid;
    case "bestWin":
      return s.longestWinStreak;
    case "bestLoss":
      return s.longestLossStreak;
  }
}

/** Highest first, no value last. The sort is stable, so ties keep the rank order they came in. */
export function orderByMetric(stats: PlayerStats[], metric: PocketMetric): PlayerStats[] {
  return [...stats].sort((a, b) => (metricValue(b, metric) ?? -Infinity) - (metricValue(a, metric) ?? -Infinity));
}
