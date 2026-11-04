"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";

import type { TvData, TvStreakRow } from "../types";
import { PanelHeading } from "./panel-heading";

function StreakCard({ row }: { row: TvStreakRow }) {
  const t = useTranslations("tv.streaks");
  const hot = row.streak.result === "W";
  return (
    <li className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface p-4 text-center shadow-card 2xl:gap-5 2xl:p-8">
      <PlayerAvatar player={row.player} size="xl" streak={row.streak} />
      <p className="max-w-full truncate text-2xl font-bold 2xl:text-4xl">{row.player.name}</p>
      <p
        className={
          hot
            ? "digits digits-glow text-6xl font-bold text-lamp 2xl:text-9xl"
            : "digits text-5xl font-bold text-cold 2xl:text-8xl"
        }
      >
        {row.streak.length}
      </p>
      <p className="text-sm font-medium text-ivory-muted 2xl:text-2xl">
        {t(hot ? "wins" : "losses", { count: row.streak.length })}
      </p>
    </li>
  );
}

export function StreakPanel({ data }: { data: TvData }) {
  const t = useTranslations("tv.streaks");
  if (data.hot.length === 0 && data.cold.length === 0) {
    return (
      <section>
        <PanelHeading title={t("title")} />
        <EmptyState title={t("empty")} body={t("emptyBody")} className="2xl:py-24" />
      </section>
    );
  }

  return (
    <section className="space-y-6 2xl:space-y-12">
      <PanelHeading title={t("title")} />
      {data.hot.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-2xl font-bold text-win 2xl:text-5xl">{t("hot")}</h3>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5 2xl:gap-8">
            {data.hot.map((row) => (
              <StreakCard key={row.player.id} row={row} />
            ))}
          </ul>
        </div>
      )}
      {data.cold.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-2xl font-bold text-cold 2xl:text-5xl">{t("cold")}</h3>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:gap-8">
            {data.cold.map((row) => (
              <StreakCard key={row.player.id} row={row} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
