"use client";

import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/domain";

import type { TvData } from "../types";
import { PanelHeading } from "./panel-heading";

export function LeaderboardPanel({ data }: { data: TvData }) {
  const t = useTranslations("tv.leaderboard");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <section>
      <PanelHeading title={t("title")} />
      {data.top.length === 0 ? (
        <EmptyState title={t("empty")} body={t("emptyBody")} className="2xl:py-24" />
      ) : (
        <ol className="space-y-3 2xl:space-y-5">
          {data.top.map((row) => (
            <li
              key={row.player.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border bg-surface px-4 py-3 shadow-card 2xl:gap-8 2xl:px-10 2xl:py-5",
                row.rank === 1 ? "border-lamp/50 shadow-lamp" : "border-line",
              )}
            >
              <span
                className={cn(
                  "digits w-12 text-center text-5xl font-bold 2xl:w-24 2xl:text-8xl",
                  row.rank === 1 ? "text-lamp digits-glow" : "text-ivory-faint",
                )}
              >
                {row.rank}
              </span>
              <PlayerAvatar player={row.player} size="lg" streak={row.streak} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-bold 2xl:text-5xl">{row.player.name}</p>
                <p className="text-base text-ivory-muted 2xl:text-3xl">
                  {tc("record", { wins: row.wins, losses: row.losses })} · {formatPercent(row.winRate, locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="digits text-4xl font-bold text-lamp digits-glow 2xl:text-8xl">{Math.round(row.elo)}</p>
                <p className="text-2xs font-semibold uppercase tracking-label text-ivory-faint 2xl:text-xl">
                  {tc("elo")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
