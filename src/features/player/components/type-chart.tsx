"use client";

import { useLocale } from "next-intl";
import { Bar, BarChart, Rectangle, XAxis, YAxis, type BarShapeProps } from "recharts";

import { formatPercent, GAME_LABEL, GAME_TYPES, type GameType } from "@/lib/domain";

interface TypeRate {
  played: number;
  wins: number;
  winRate: number;
}

// Same tones as GameTypeBadge.
const COLOR: Record<GameType, string> = {
  "3c_real": "var(--color-win)",
  "3c_fake": "var(--color-cold)",
  libre: "var(--color-lamp)",
};
const AXIS = { fill: "var(--color-ivory-muted)", fontSize: 12 } as const;

/** Win rate per game type as three bars; the numbers are also listed as text beside it, so the drawing is decorative. */
export function TypeChart({ byGameType }: { byGameType: Record<GameType, TypeRate> }) {
  const locale = useLocale();
  const data = GAME_TYPES.map((type) => ({
    type,
    label: GAME_LABEL[type],
    rate: Math.round(byGameType[type].winRate * 100),
    color: COLOR[type],
  }));
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div aria-hidden className="h-40 w-full sm:w-1/2">
        <BarChart
          responsive
          data={data}
          width="100%"
          height="100%"
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          accessibilityLayer={false}
        >
          <XAxis dataKey="label" tick={AXIS} stroke="var(--color-line-strong)" tickLine={false} />
          <YAxis hide domain={[0, 100]} />
          <Bar
            dataKey="rate"
            shape={(p: BarShapeProps) => <Rectangle {...p} fill={p.payload.color} radius={[6, 6, 0, 0]} />}
          />
        </BarChart>
      </div>
      <dl className="grid flex-1 grid-cols-1 gap-2">
        {GAME_TYPES.map((type) => {
          const row = byGameType[type];
          return (
            <div
              key={type}
              className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5 last:border-b-0"
            >
              <dt className="text-sm text-ivory-muted">{GAME_LABEL[type]}</dt>
              <dd className="digits text-lg font-bold">
                {row.played ? formatPercent(row.winRate, locale) : "—"}
                <span className="pl-2 text-xs font-normal text-ivory-faint">
                  {row.wins}/{row.played}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
