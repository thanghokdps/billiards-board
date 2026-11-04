import { ELO_START, type StatPlayer } from "@/lib/stats";

export interface PairingOption {
  format: "1v1" | "2v2";
  sideA: StatPlayer[];
  sideB: StatPlayer[];
  /** Absolute difference of the sides' average Elo. */
  gap: number;
  avgA: number;
  avgB: number;
}

const MAX_DUELS = 2;

type Rate = (player: StatPlayer) => number;

const average = (side: StatPlayer[], rate: Rate) => side.reduce((sum, p) => sum + rate(p), 0) / side.length;

function option(format: PairingOption["format"], sideA: StatPlayer[], sideB: StatPlayer[], rate: Rate): PairingOption {
  const avgA = average(sideA, rate);
  const avgB = average(sideB, rate);
  return { format, sideA, sideB, gap: Math.abs(avgA - avgB), avgA, avgB };
}

/** The closest 1v1 pairs (up to two) and the closest 2v2 split among everyone who is here today. */
export function suggestPairings(players: StatPlayer[], ratings: Record<number, number>): PairingOption[] {
  const rate: Rate = (p) => ratings[p.id] ?? ELO_START;

  const duels: PairingOption[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) duels.push(option("1v1", [players[i]!], [players[j]!], rate));
  }
  duels.sort((a, b) => a.gap - b.gap);

  let team: PairingOption | null = null;
  for (let a = 0; a < players.length; a++) {
    for (let b = a + 1; b < players.length; b++) {
      for (let c = b + 1; c < players.length; c++) {
        for (let d = c + 1; d < players.length; d++) {
          const [p, q, r, s] = [players[a]!, players[b]!, players[c]!, players[d]!];
          for (const split of [
            option("2v2", [p, q], [r, s], rate),
            option("2v2", [p, r], [q, s], rate),
            option("2v2", [p, s], [q, r], rate),
          ]) {
            if (!team || split.gap < team.gap) team = split;
          }
        }
      }
    }
  }

  return team ? [...duels.slice(0, MAX_DUELS), team] : duels.slice(0, MAX_DUELS);
}
