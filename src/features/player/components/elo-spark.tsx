"use client";

import { useTranslations } from "next-intl";
import { Line, LineChart, YAxis } from "recharts";

interface EloSparkProps {
  history: { date: string; elo: number | null }[];
  color: string;
}

/** Elo over time as a sparkline in the player's ball colour; current, peak and low are written out beside it. */
export function EloSpark({ history, color }: EloSparkProps) {
  const t = useTranslations("player.elo");
  const values = history.flatMap((h) => (h.elo === null ? [] : [h.elo]));
  if (values.length < 2) return <p className="text-sm text-ivory-muted">{t("empty")}</p>;
  const stats = [
    { key: "current", value: values.at(-1)! },
    { key: "peak", value: Math.max(...values) },
    { key: "low", value: Math.min(...values) },
  ] as const;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div aria-hidden className="h-20 w-full sm:w-1/2">
        <LineChart
          responsive
          data={history}
          width="100%"
          height="100%"
          margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
          accessibilityLayer={false}
        >
          <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
          <Line type="monotone" dataKey="elo" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </div>
      <dl className="grid flex-1 grid-cols-3 gap-2">
        {stats.map(({ key, value }) => (
          <div key={key}>
            <dt className="text-xs font-medium text-ivory-muted">{t(key)}</dt>
            <dd
              className={
                key === "current" ? "digits text-3xl font-bold text-lamp digits-glow" : "digits text-3xl font-bold"
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
