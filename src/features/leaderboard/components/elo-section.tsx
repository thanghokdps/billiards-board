"use client";

import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

import { SectionTitle } from "./section-title";
import { useStoredFlag } from "../lib/use-stored-flag";

export interface EloPoint {
  date: string;
  ratings: Record<number, number>;
}

const STORAGE_KEY = "an-bill:leaderboard:elo-hidden";
const AXIS = { fill: "var(--color-ivory-faint)", fontSize: 11 } as const;

/** One point per session day (the last match of the day), so a busy day does not stretch the axis. */
function perDay(history: EloPoint[]): EloPoint[] {
  const byDate = new Map<string, EloPoint>();
  for (const point of history) byDate.set(point.date, point);
  return [...byDate.values()];
}

const shortDate = (date: string) => `${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`;

/** Elo is "for reference": the section can be hidden, and the choice is remembered in this browser. */
export function EloSection({ players, history }: { players: StatPlayer[]; history: EloPoint[] }) {
  const t = useTranslations("leaderboard.elo");
  const locale = useLocale();
  const [hidden, setHidden] = useStoredFlag(STORAGE_KEY, false);
  const days = useMemo(() => perDay(history), [history]);
  const data = useMemo(
    () =>
      days.map((d) => ({
        date: d.date,
        ...Object.fromEntries(Object.entries(d.ratings).map(([id, elo]) => [`p${id}`, elo])),
      })),
    [days],
  );
  const latest = days.at(-1)?.ratings ?? {};
  const legend = players
    .filter((p) => latest[p.id] !== undefined)
    .sort((a, b) => (latest[b.id] ?? 0) - (latest[a.id] ?? 0));

  return (
    <section aria-labelledby="elo-title" className="space-y-3">
      <Card>
        <CardHeader>
          <div>
            <SectionTitle id="elo-title">{t("title")}</SectionTitle>
            <p className="mt-1 text-xs text-ivory-muted">{t("hint")}</p>
          </div>
          <Button variant="subtle" size="sm" aria-pressed={!hidden} onClick={() => setHidden(!hidden)}>
            {hidden ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
            {hidden ? t("show") : t("hide")}
          </Button>
        </CardHeader>
        <CardBody>
          {hidden ? (
            <p className="text-sm text-ivory-faint">{t("hidden")}</p>
          ) : days.length < 2 ? (
            <p className="text-sm text-ivory-muted">{t("empty")}</p>
          ) : (
            <figure aria-label={t("chartLabel")} className="space-y-3">
              {/* The legend below carries the same numbers as text, so the drawing is skipped by screen readers. */}
              <div aria-hidden className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer={false}>
                    <CartesianGrid stroke="var(--color-line)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={AXIS}
                      stroke="var(--color-line-strong)"
                      minTickGap={24}
                    />
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
              </div>
              <figcaption>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {legend.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 text-sm">
                      <Ball color={p.ballColor} number={p.ballNumber} className="size-5" />
                      <span className="font-semibold">{p.name}</span>
                      <span className="digits text-base text-lamp">{latest[p.id]}</span>
                    </li>
                  ))}
                </ul>
              </figcaption>
            </figure>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
