import type { Period } from "@/lib/domain";

export const PERIODS = ["all", "week", "month", "year"] as const satisfies readonly Period[];
export const GRAINS = ["day", "week", "month"] as const;
export type Grain = (typeof GRAINS)[number];

export function parsePeriod(value: string | undefined): Period {
  return PERIODS.find((p) => p === value) ?? "all";
}

/** A short period needs a fine grain, otherwise the chart would be a single bar. */
const DEFAULT_GRAIN: Record<Period, Grain> = { week: "day", month: "week", year: "month", all: "month" };

export function parseGrain(value: string | undefined, period: Period): Grain {
  return GRAINS.find((g) => g === value) ?? DEFAULT_GRAIN[period];
}
