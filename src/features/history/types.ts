import type { StatMatch } from "@/lib/stats";

/** A history row: the stat DTO plus the note (the repository returns it at runtime, the stat type leaves it out). */
export interface HistoryMatch extends StatMatch {
  note: string | null;
}

export interface HistoryDay {
  date: string;
  bill: number;
  matches: HistoryMatch[];
}

/** A highlight ready for the browser: a stored photo (`image`) or an external clip link (`link`). */
export interface HighlightItem {
  id: number;
  matchId: string;
  caption: string | null;
  kind: "image" | "link";
  href: string;
}
