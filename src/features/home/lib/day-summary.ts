import { APP_TIMEZONE } from "@/lib/domain";
import type { StatMatch, StatPlayer } from "@/lib/stats";

/** The lunch recap appears from this local hour (requirement: "mở app sau 13h"). */
export const RECAP_FROM_HOUR = 13;

export function localHour(at: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIMEZONE, hour: "numeric", hourCycle: "h23" }).format(at),
  );
}

interface Leaders {
  players: StatPlayer[];
  value: number;
}

export interface DaySummary {
  matchCount: number;
  totalBill: number;
  topWinners: Leaders | null;
  topPayers: Leaders | null;
}

function leaders(totals: Map<number, { player: StatPlayer; value: number }>): Leaders | null {
  const rows = [...totals.values()].map((r) => ({ player: r.player, value: Math.round(r.value) }));
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (max <= 0) return null;
  return { players: rows.filter((r) => r.value === max).map((r) => r.player), value: max };
}

/** Deterministic day summary: wins per player, bill share per losing player (loser side pays, split per head). */
export function summarizeDay(matches: StatMatch[]): DaySummary {
  const wins = new Map<number, { player: StatPlayer; value: number }>();
  const paid = new Map<number, { player: StatPlayer; value: number }>();
  const add = (totals: typeof wins, player: StatPlayer, amount: number) => {
    const row = totals.get(player.id) ?? { player, value: 0 };
    row.value += amount;
    totals.set(player.id, row);
  };
  for (const m of matches) {
    const winners = m.winnerSide === "a" ? m.sideA : m.sideB;
    const losers = m.winnerSide === "a" ? m.sideB : m.sideA;
    for (const p of winners) add(wins, p, 1);
    for (const p of losers) add(paid, p, (m.bill ?? 0) / losers.length);
  }
  return {
    matchCount: matches.length,
    totalBill: matches.reduce((sum, m) => sum + (m.bill ?? 0), 0),
    topWinners: leaders(wins),
    topPayers: leaders(paid),
  };
}
