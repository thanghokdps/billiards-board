"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/domain";
import { clack, haptic } from "@/lib/feedback";
import type { PlayerStats } from "@/lib/stats";

import { GroupFormList } from "./group-form-list";
import { PlayerStatsPanel } from "./player-stats-panel";
import { SectionTitle } from "./section-title";
import { TableBall } from "./table-ball";
import { TableCanvas, type CanvasBall } from "./table-canvas";
import { TablePocket } from "./table-pocket";
import { ballPoint, orderByMetric, POCKET_METRICS, POCKETS, rackPoint, type PocketMetric } from "../lib/pocket-layout";

const RACK_TALL = { x: 13, y: 10 };
const RACK_WIDE = { x: 7, y: 15 };
const BALL_STAGGER_MS = 60;

const LABEL_KEY = {
  winRate: "winRate",
  avgPoints: "avgPoints",
  streak: "streak",
  paid: "paid",
  bestWin: "pocketBestWin",
  bestLoss: "pocketBestLoss",
} as const;

/** The racked balls break when the table scrolls into view, so the first roll isn't spent off-screen. */
function useBreakInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setBroken(true);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, broken };
}

/** Every player as a ball on the felt: a pocket ranks them by one stat, a ball opens all of that player's stats. */
export function PocketTable({ ranked }: { ranked: PlayerStats[] }) {
  const t = useTranslations("leaderboard.table");
  const locale = useLocale();
  const { ref, broken } = useBreakInView<HTMLDivElement>();
  const [metric, setMetric] = useState<PocketMetric>("winRate");
  const [selectedId, setSelectedId] = useState(ranked[0]?.player.id);
  const [showGroup, setShowGroup] = useState(false);
  const [live, setLive] = useState(false);

  const active = ranked.filter((s) => s.played > 0);
  const bench = ranked.filter((s) => s.played === 0);
  const order = orderByMetric(active, metric);
  const leader = order[0];
  const selected = ranked.find((s) => s.player.id === selectedId) ?? ranked[0];

  const restPoints = (s: PlayerStats, index: number) => {
    const rank = order.indexOf(s);
    const { tall, wide } = POCKETS[metric];
    return {
      tall: broken ? ballPoint(tall, rank, active.length) : rackPoint(index, RACK_TALL),
      wide: broken ? ballPoint(wide, rank, active.length) : rackPoint(index, RACK_WIDE),
    };
  };
  const metricLabel = t(LABEL_KEY[metric]);
  const sceneBalls: CanvasBall[] = active.map((s, i) => ({
    id: s.player.id,
    color: s.player.ballColor,
    number: s.player.ballNumber,
    delayMs: order.indexOf(s) * BALL_STAGGER_MS,
    ...restPoints(s, i),
  }));

  const valueOf = (s: PlayerStats): string => {
    switch (metric) {
      case "winRate":
        return formatPercent(s.winRate, locale);
      case "avgPoints":
        return s.avgPoints == null ? "—" : s.avgPoints.toFixed(1);
      case "streak":
        if (!s.current) return "—";
        return t(s.current.result === "W" ? "streakWins" : "streakLosses", { count: s.current.length });
      case "paid":
        return s.paid ? `${Math.round(s.paid / 1000)}k` : "0";
      case "bestWin":
        return String(s.longestWinStreak);
      case "bestLoss":
        return String(s.longestLossStreak);
    }
  };

  // Five balls side by side on a phone leave no room for "2 thắng".
  const shortValueOf = (s: PlayerStats): string => {
    if (metric !== "streak" || !s.current) return valueOf(s);
    return `${s.current.result === "W" ? "+" : "−"}${s.current.length}`;
  };

  const rankLabel = (s: PlayerStats): string => {
    const index = order.indexOf(s);
    return index < 0 ? t("notPlayed") : t("rankOf", { rank: index + 1, metric: metricLabel.toLocaleLowerCase(locale) });
  };

  const pickPocket = (next: PocketMetric) => {
    setMetric(next);
    setSelectedId(orderByMetric(active, next)[0]?.player.id);
    setShowGroup(false);
    clack(0.3);
    haptic();
  };

  const pickBall = (id: number) => {
    setSelectedId(id);
    setShowGroup(false);
    haptic();
  };

  return (
    <section aria-labelledby="table-title" className="space-y-3">
      <SectionTitle id="table-title">{t("title")}</SectionTitle>
      <div className="@container">
        <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-2">
            <div ref={ref} className="@container">
              <div className="relative rounded-xl p-3.5">
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-0 rounded-xl bg-wood shadow-card transition-opacity duration-500",
                    live && "opacity-0",
                  )}
                />
                <div className="relative aspect-3/4 rounded-md @xl:aspect-8/5">
                  <div
                    aria-hidden
                    className={cn(
                      "felt absolute inset-0 rounded-md transition-opacity duration-500",
                      live && "opacity-0",
                    )}
                  />
                  <TableCanvas balls={sceneBalls} broken={broken} live={live} onLiveChange={setLive} />
                  {POCKET_METRICS.map((m) => (
                    <TablePocket
                      key={m}
                      label={t(LABEL_KEY[m])}
                      tall={POCKETS[m].tall}
                      wide={POCKETS[m].wide}
                      active={m === metric}
                      live={live}
                      onPick={() => pickPocket(m)}
                    />
                  ))}
                  {active.map((s, i) => {
                    const rank = order.indexOf(s);
                    const { tall, wide } = POCKETS[metric];
                    return (
                      <TableBall
                        key={s.player.id}
                        stats={s}
                        label={t("ballLabel", {
                          name: s.player.name,
                          rank: rank + 1,
                          metric: metricLabel,
                          value: valueOf(s),
                        })}
                        value={shortValueOf(s)}
                        {...restPoints(s, i)}
                        tallLine={tall}
                        wideLine={wide}
                        rank={rank}
                        showTag={broken}
                        selected={s === selected}
                        live={live}
                        onPick={() => pickBall(s.player.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            {leader && (
              <p aria-live="polite" className="text-sm font-semibold">
                {t("leads", {
                  name: leader.player.name,
                  metric: metricLabel.toLocaleLowerCase(locale),
                  value: valueOf(leader),
                })}
              </p>
            )}
            {bench.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-ivory-muted">{t("notPlayed")}</span>
                {bench.map((s) => (
                  <button
                    key={s.player.id}
                    type="button"
                    aria-label={s.player.name}
                    aria-pressed={s === selected}
                    onClick={() => pickBall(s.player.id)}
                    className="flex size-11 cursor-pointer items-center justify-center rounded-full opacity-60 hover:opacity-100"
                  >
                    <PlayerAvatar player={s.player} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <Card className="flex flex-col justify-between gap-3 self-start p-4">
            {showGroup && <GroupFormList ranked={ranked} />}
            {!showGroup && selected && <PlayerStatsPanel stats={selected} rankLabel={rankLabel(selected)} />}
            <Button variant="ghost" onClick={() => setShowGroup(!showGroup)}>
              {t(showGroup ? "showPlayer" : "showGroup")}
            </Button>
          </Card>
        </div>
      </div>
      <p className="text-2xs text-ivory-faint">{t("hint")}</p>
    </section>
  );
}
