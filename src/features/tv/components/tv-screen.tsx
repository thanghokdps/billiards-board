"use client";

import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/domain";

import { useClock } from "../hooks/use-clock";
import { useRotation } from "../hooks/use-rotation";
import type { TvData } from "../types";
import { BillPanel } from "./bill-panel";
import { LeaderboardPanel } from "./leaderboard-panel";
import { ScoreboardPanel } from "./scoreboard-panel";
import { StreakPanel } from "./streak-panel";

const ROTATE_SECONDS = 12;
const REFRESH_MS = 30_000;
const PANELS = ["scoreboard", "streaks", "leaderboard", "bill"] as const;

/** Full-bleed venue screen: boards rotate every 12 s, data refreshes every 30 s, ← / → switch by hand. */
export function TvScreen({ data }: { data: TvData }) {
  const t = useTranslations("tv");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const now = useClock();
  const [paused, setPaused] = useState(false);
  const { index, progress, step } = useRotation(PANELS.length, ROTATE_SECONDS, paused);

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const active = PANELS[index]!;

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4 md:p-8 2xl:gap-8 2xl:p-12">
      <header className="flex items-center gap-4 2xl:gap-6">
        <Ball className="size-12 2xl:size-24" />
        <div className="min-w-0">
          <p className="truncate font-display text-3xl font-bold uppercase leading-none tracking-wide 2xl:text-7xl">
            {tc("appName")}
          </p>
          <p className="mt-1 truncate text-sm text-ivory-muted 2xl:text-2xl">{tc("slogan")}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="digits digits-glow text-4xl font-bold text-lamp 2xl:text-8xl" aria-hidden={!now}>
            {now ? formatTime(now, locale) : "--:--"}
          </p>
          {data.shownDate && (
            <p className="text-sm text-ivory-muted 2xl:text-2xl">{formatDate(data.shownDate, locale, "long")}</p>
          )}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* Remounting on each board replays the fade (neutralised under prefers-reduced-motion). */}
        <div key={active} data-state="open" className="overlay-fade h-full">
          {active === "scoreboard" && <ScoreboardPanel data={data} />}
          {active === "streaks" && <StreakPanel data={data} />}
          {active === "leaderboard" && <LeaderboardPanel data={data} />}
          {active === "bill" && <BillPanel data={data} />}
        </div>
      </main>

      <footer className="flex items-center gap-4 2xl:gap-8">
        <ol aria-label={t("panelsLabel")} className="grid flex-1 grid-cols-4 gap-2 2xl:gap-4">
          {PANELS.map((panel, i) => (
            <li key={panel} aria-current={i === index ? "step" : undefined} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3 2xl:h-3">
                <div
                  className={cn(
                    "h-full bg-lamp motion-reduce:transition-none",
                    i === index && progress > 1 / ROTATE_SECONDS && "transition-[width] duration-1000 ease-linear",
                  )}
                  style={{
                    width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" /* progress is data */,
                  }}
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 truncate text-xs font-semibold uppercase tracking-label 2xl:mt-3 2xl:text-2xl",
                  i === index ? "text-lamp" : "text-ivory-faint",
                )}
              >
                {t(`panel.${panel}`)}
              </p>
            </li>
          ))}
        </ol>

        <p className="hidden text-sm text-ivory-faint lg:block 2xl:text-2xl">{t("shortcutHint")}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={t("prev")} onClick={() => step(-1)}>
            <ChevronLeft className="size-6" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={paused ? t("play") : t("pause")}
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("next")} onClick={() => step(1)}>
            <ChevronRight className="size-6" aria-hidden />
          </Button>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/" aria-label={t("exitLabel")}>
            <X className="size-4" aria-hidden />
            {t("exit")}
          </Link>
        </Button>
      </footer>
    </div>
  );
}
