import type { GameType, Side } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { PredictionView } from "@/server/predictions/repository";

/** A prediction with its players resolved, ready for a client component. */
export interface PredictionCardData {
  id: number;
  date: string;
  gameType: GameType | null;
  status: PredictionView["status"];
  winnerSide: Side | null;
  sideA: PlayerRef[];
  sideB: PlayerRef[];
  votes: { voter: PlayerRef; pick: Side }[];
}

const resolve = (ids: number[], byId: Map<number, PlayerRef>) =>
  ids.map((id) => byId.get(id)).filter((p): p is PlayerRef => p !== undefined);

/** Null when a side's player no longer exists, so the card never shows a half-empty side. */
export function toCardData(view: PredictionView, byId: Map<number, PlayerRef>): PredictionCardData | null {
  const sideA = resolve(view.sideA, byId);
  const sideB = resolve(view.sideB, byId);
  if (sideA.length !== view.sideA.length || sideB.length !== view.sideB.length) return null;
  return {
    id: view.id,
    date: view.date,
    gameType: view.gameType,
    status: view.status,
    winnerSide: view.winnerSide,
    sideA,
    sideB,
    votes: view.votes.flatMap((v) => {
      const voter = byId.get(v.voterId);
      return voter ? [{ voter, pick: v.pick }] : [];
    }),
  };
}
