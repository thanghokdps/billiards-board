import type { SpecialReason } from "@/lib/stats";

/** A special moment created with a match (the UI plays STREAK BROKEN, confetti …). */
export interface MatchEvent {
  type: SpecialReason;
  matchId: string;
}
