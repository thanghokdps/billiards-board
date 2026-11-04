import type { MatchView } from "@/server/matches/schema";

/** One real match as a line on the wall: the winner's colour, more cushions for a longer game. */
export interface MatchStroke {
  id: string;
  color: string;
  cushions: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

const MIN_CUSHIONS = 3;
const MAX_CUSHIONS = 9;
const POINTS_PER_CUSHION = 15;
const FALLBACK_COLOR = "#f5c451";
const WARM_UP_ROUNDS = 8;
const MIN_SHOT_ANGLE = 0.35;

export function toMatchStrokes(matches: MatchView[]): MatchStroke[] {
  return matches.map((match) => {
    const winner = (match.winnerSide === "a" ? match.sideA : match.sideB)[0];
    const points = (match.scoreA ?? 0) + (match.scoreB ?? 0) + match.scores.reduce((sum, s) => sum + s.score, 0);
    return {
      id: match.id,
      color: winner?.ballColor ?? FALLBACK_COLOR,
      cushions: Math.min(MIN_CUSHIONS + Math.ceil(points / POINTS_PER_CUSHION), MAX_CUSHIONS),
    };
  });
}

/** Seeded from the match id, so a match keeps its line on every visit and every device (FNV-1a, then xorshift). */
function seededRandom(id: string) {
  let state = 2166136261;
  for (const char of id) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

/** The ball's path on a unit table: straight runs that mirror off each cushion. */
export function strokePath({ id, cushions }: MatchStroke): StrokePoint[] {
  const random = seededRandom(id);
  // Similar ids start the generator close together, so its first outputs are thrown away.
  for (let i = 0; i < WARM_UP_ROUNDS; i++) random();
  let { x, y } = { x: random(), y: random() };
  // Kept off the axes: a shot along a rail stacks into parallel lines instead of a drawing.
  const quarter = Math.floor(random() * 4);
  const angle = (quarter * Math.PI) / 2 + MIN_SHOT_ANGLE + random() * (Math.PI / 2 - MIN_SHOT_ANGLE * 2);
  let dx = Math.cos(angle);
  let dy = Math.sin(angle);

  const points = [{ x, y }];
  for (let i = 0; i < cushions; i++) {
    const toSide = dx > 0 ? (1 - x) / dx : -x / (dx || 1);
    const toEnd = dy > 0 ? (1 - y) / dy : -y / (dy || 1);
    const run = Math.min(toSide, toEnd);
    x += dx * run;
    y += dy * run;
    points.push({ x, y });
    if (toSide <= toEnd) dx = -dx;
    else dy = -dy;
  }
  return points;
}
