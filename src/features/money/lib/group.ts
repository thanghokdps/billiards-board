import { weekKey } from "@/lib/domain";
import type { MoneyBreakdown } from "@/lib/stats";

import type { Grain } from "./params";

export interface BillBucket {
  /** `YYYY-MM-DD`, `YYYY-Www` or `YYYY-MM`, depending on the grain. */
  key: string;
  total: number;
}

const KEY_OF: Record<Grain, (date: string) => string> = {
  day: (date) => date,
  week: weekKey,
  month: (date) => date.slice(0, 7),
};

/** `byDate` is sorted ascending, so the insertion order of the map is chronological. */
export function groupTotals(byDate: MoneyBreakdown["byDate"], grain: Grain): BillBucket[] {
  const totals = new Map<string, number>();
  for (const { date, total } of byDate) {
    const key = KEY_OF[grain](date);
    totals.set(key, (totals.get(key) ?? 0) + total);
  }
  return [...totals].map(([key, total]) => ({ key, total }));
}
