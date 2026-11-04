import type { Streak } from "@/components/ui/player-avatar";
import type { StatMatch, StatPlayer } from "@/lib/stats";

export interface TvStreakRow {
  player: StatPlayer;
  streak: Streak;
}

export interface TvRankRow {
  rank: number;
  player: StatPlayer;
  wins: number;
  losses: number;
  winRate: number;
  elo: number;
  streak: Streak | null;
}

export interface TvBill {
  total: number;
  matchCount: number;
  average: number;
  payers: { player: StatPlayer; paid: number }[];
}

/** Everything the venue screen shows, derived on the server and refreshed every 30 s. */
export interface TvData {
  /** The session date being shown: today, or the latest one when nothing was played today. */
  shownDate: string | null;
  isToday: boolean;
  /** Newest first. */
  matches: StatMatch[];
  hot: TvStreakRow[];
  cold: TvStreakRow[];
  top: TvRankRow[];
  bill: TvBill;
}
