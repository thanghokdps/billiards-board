import { GAME_TYPES, type GameType } from "@/lib/domain";
import { headToHead, type HeadToHead, type StatMatch, type StatPlayer } from "@/lib/stats";

export interface TypeSplit {
  gameType: GameType;
  aWins: number;
  bWins: number;
  played: number;
}

export interface RivalryBreakdown {
  byGameType: TypeSplit[];
  /** Who has won the latest meetings in a row, or null when the last two meetings had different winners. */
  streak: { player: StatPlayer; length: number } | null;
}

/** The winner of one meeting of `h.a` and `h.b`, who are on opposite sides by construction. */
function winnerOf(h: HeadToHead, match: StatMatch): StatPlayer {
  const aOnSideA = match.sideA.some((p) => p.id === h.a.id);
  return (match.winnerSide === "a") === aOnSideA ? h.a : h.b;
}

/**
 * `h.recent` holds only the last 10 meetings, so the per-type split re-runs `headToHead` on the full list
 * filtered by type; the streak is read from `recent` (newest first), so it is capped at 10.
 */
export function rivalryBreakdown(h: HeadToHead, all: StatMatch[]): RivalryBreakdown {
  const byGameType = GAME_TYPES.map((gameType) => {
    const { aWins, bWins, played } = headToHead(
      h.a,
      h.b,
      all.filter((m) => m.gameType === gameType),
    );
    return { gameType, aWins, bWins, played };
  });

  const [latest, ...older] = h.recent;
  if (!latest) return { byGameType, streak: null };
  const holder = winnerOf(h, latest);
  let length = 1;
  for (const match of older) {
    if (winnerOf(h, match).id !== holder.id) break;
    length += 1;
  }
  return { byGameType, streak: length >= 2 ? { player: holder, length } : null };
}
