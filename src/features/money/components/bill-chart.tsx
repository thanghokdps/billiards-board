"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { cn } from "@/lib/cn";
import { formatCompactVnd, formatVnd } from "@/lib/domain";

import { ChipCanvas } from "./chip-canvas";
import type { BillBucket } from "../lib/group";
import type { Grain } from "../lib/params";

interface BillChartProps {
  buckets: BillBucket[];
  grain: Grain;
}

/** Past this, axis labels on every stack collide on a phone. */
const MAX_TICKS = 7;

/** Axis label of one bucket: `04/11`, `Tuần 45` or `11/26`. */
function useBucketLabel(grain: Grain) {
  const t = useTranslations("money");
  return (key: string): string => {
    if (grain === "week") return t("weekLabel", { week: Number(key.slice(-2)) });
    const [year, month, day] = key.split("-");
    return grain === "day" ? `${day}/${month}` : `${month}/${year?.slice(2)}`;
  };
}

function ChartTooltip({
  active,
  payload,
  label,
  labelOf,
  locale,
}: TooltipContentProps & { labelOf: (key: string) => string; locale: string }) {
  const value = payload?.[0]?.value;
  if (!active || typeof value !== "number") return null;
  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-ivory-muted">{labelOf(String(label))}</p>
      <p className="digits text-lg font-bold text-lamp">{formatVnd(value, locale)}</p>
    </div>
  );
}

export function BillChart({ buckets, grain }: BillChartProps) {
  const t = useTranslations("money");
  const locale = useLocale();
  const labelOf = useBucketLabel(grain);
  const [live, setLive] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const totals = useMemo(() => buckets.map((b) => b.total), [buckets]);
  const shown = buckets[active ?? buckets.length - 1];
  const tickEvery = Math.ceil(buckets.length / MAX_TICKS);

  return (
    <div role="img" aria-label={t("chartAria")} className="relative h-56 w-full overflow-clip rounded-md sm:h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
        className={cn("transition-opacity duration-500", live && "opacity-0")}
      >
        <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="key"
            tickFormatter={labelOf}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line-strong)" }}
            tick={{ fill: "var(--color-ivory-muted)", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-ivory-muted)", fontSize: 11 }}
            tickFormatter={(v: number) => formatCompactVnd(v, locale)}
          />
          <Tooltip
            content={(props) => <ChartTooltip {...props} labelOf={labelOf} locale={locale} />}
            cursor={{ fill: "var(--color-surface-3)" }}
          />
          <Bar dataKey="total" fill="var(--color-lamp)" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
      <ChipCanvas totals={totals} live={live} onLiveChange={setLive} onActiveChange={setActive} />
      {live && shown && (
        <>
          {buckets.map(
            ({ key }, index) =>
              index % tickEvery === 0 && (
                <span key={key} data-stack={index} className="chip-tick">
                  {labelOf(key)}
                </span>
              ),
          )}
          <div data-tip className="chip-tip rounded-md border border-line-strong bg-surface-2 px-2.5 py-1 shadow-pop">
            <p className="text-2xs font-medium text-ivory-muted">{labelOf(shown.key)}</p>
            <p className="digits text-base font-bold text-lamp">{formatVnd(shown.total, locale)}</p>
          </div>
        </>
      )}
    </div>
  );
}
