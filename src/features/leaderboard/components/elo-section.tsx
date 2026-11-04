"use client";

import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

import { EloCanvas } from "./elo-canvas";
import { EloLineChart } from "./elo-line-chart";
import { SectionTitle } from "./section-title";
import { useStoredFlag } from "../lib/use-stored-flag";

export interface EloPoint {
  date: string;
  ratings: Record<number, number>;
}

const STORAGE_KEY = "an-bill:leaderboard:elo-hidden";

/** One point per session day (the last match of the day), so a busy day does not stretch the axis. */
function perDay(history: EloPoint[]): EloPoint[] {
  const byDate = new Map<string, EloPoint>();
  for (const point of history) byDate.set(point.date, point);
  return [...byDate.values()];
}

/** Elo is "for reference": the section can be hidden, and the choice is remembered in this browser. */
export function EloSection({ players, history }: { players: StatPlayer[]; history: EloPoint[] }) {
  const t = useTranslations("leaderboard.elo");
  const locale = useLocale();
  const [hidden, setHidden] = useStoredFlag(STORAGE_KEY, false);
  const [live, setLive] = useState(false);
  const [scrubbedDay, setScrubbedDay] = useState<number | null>(null);
  const days = useMemo(() => perDay(history), [history]);
  const data = useMemo(
    () =>
      days.map((d) => ({
        date: d.date,
        ...Object.fromEntries(Object.entries(d.ratings).map(([id, elo]) => [`p${id}`, elo])),
      })),
    [days],
  );
  const series = useMemo(
    () =>
      players.map((p) => ({
        color: p.ballColor,
        number: p.ballNumber,
        ratings: days.map((d) => d.ratings[p.id] ?? null),
      })),
    [players, days],
  );
  const shownDay = days[scrubbedDay ?? days.length - 1];
  const latest = days.at(-1)?.ratings ?? {};
  const shown = shownDay?.ratings ?? {};
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
              <div aria-hidden className="relative h-64 w-full sm:h-80">
                <div className={cn("size-full transition-opacity duration-500", live && "opacity-0")}>
                  <EloLineChart players={players} data={data} />
                </div>
                <EloCanvas series={series} live={live} onLiveChange={setLive} onDayChange={setScrubbedDay} />
              </div>
              <figcaption className="space-y-2">
                {live && shownDay && (
                  <p className="text-xs font-medium text-ivory-muted">{formatDate(shownDay.date, locale)}</p>
                )}
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {legend.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 text-sm">
                      <Ball color={p.ballColor} number={p.ballNumber} className="size-5" />
                      <span className="font-semibold">{p.name}</span>
                      <span className="digits text-base text-lamp">{shown[p.id] ?? "—"}</span>
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
