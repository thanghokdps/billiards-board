import type { PlayerRef } from "@/server/matches/schema";

export interface OracleRow {
  player: PlayerRef;
  correct: number;
  total: number;
  accuracy: number;
}

/** Most correct picks first; ties go to the better hit rate, then to the more active voter. */
export function buildOracleBoard(
  tally: { voterId: number; correct: number; total: number }[],
  byId: Map<number, PlayerRef>,
): OracleRow[] {
  return tally
    .flatMap((row) => {
      const player = byId.get(row.voterId);
      return player && row.total > 0
        ? [{ player, correct: row.correct, total: row.total, accuracy: row.correct / row.total }]
        : [];
    })
    .sort(
      (a, b) =>
        b.correct - a.correct ||
        b.accuracy - a.accuracy ||
        b.total - a.total ||
        a.player.name.localeCompare(b.player.name),
    );
}
