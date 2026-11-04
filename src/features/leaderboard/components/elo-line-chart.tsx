"use client";

import { useLocale } from "next-intl";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatDate } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

const AXIS = { fill: "var(--color-ivory-faint)", fontSize: 11 } as const;

const shortDate = (date: string) => `${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`;

/** The flat Elo chart: what reduced motion and browsers without WebGL see. */
export function EloLineChart({ players, data }: { players: StatPlayer[]; data: Record<string, unknown>[] }) {
  const locale = useLocale();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer={false}>
        <CartesianGrid stroke="var(--color-line)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} stroke="var(--color-line-strong)" minTickGap={24} />
        <YAxis
          domain={["dataMin - 10", "dataMax + 10"]}
          tick={AXIS}
          stroke="var(--color-line-strong)"
          allowDecimals={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-line-strong)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-ivory)",
          }}
          labelStyle={{ color: "var(--color-ivory-muted)" }}
          labelFormatter={(date) => formatDate(String(date), locale)}
          itemSorter={(item) => -(Number(item.value) || 0)}
        />
        {players.map((p) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={`p${p.id}`}
            name={p.name}
            stroke={p.ballColor}
            strokeWidth={2.5}
            dot={false}
            connectNulls
            animationDuration={1200}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
