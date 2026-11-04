import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { formatPercent, formatVnd } from "@/lib/domain";
import type { PlayerStats } from "@/lib/stats";

import { FormLine } from "./form-line";

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ivory-muted">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  );
}

/** Every stat of the ball the viewer tapped. */
export function PlayerStatsPanel({ stats, rankLabel }: { stats: PlayerStats; rankLabel: string }) {
  const t = useTranslations("leaderboard.table");
  const common = useTranslations("common");
  const locale = useLocale();
  const idle = stats.played === 0;
  const { current } = stats;
  return (
    <div className="space-y-3">
      <Link href={`/players/${stats.player.slug}`} className="flex items-center gap-2.5 rounded-sm hover:text-lamp">
        <PlayerAvatar player={stats.player} size="sm" streak={current} />
        <span className="min-w-0">
          <span className="block truncate font-bold">{stats.player.name}</span>
          <span className="block text-xs text-ivory-muted">{rankLabel}</span>
        </span>
      </Link>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Stat label={t("played")}>{stats.played}</Stat>
        <Stat label={t("record")}>{common("record", { wins: stats.wins, losses: stats.losses })}</Stat>
        <Stat label={t("winRate")}>{idle ? "—" : formatPercent(stats.winRate, locale)}</Stat>
        <Stat label={t("avgPoints")}>{stats.avgPoints == null ? "—" : stats.avgPoints.toFixed(1)}</Stat>
        <Stat label={t("streak")}>
          {current ? t(current.result === "W" ? "streakWins" : "streakLosses", { count: current.length }) : "—"}
        </Stat>
        <Stat label={t("paid")}>{stats.paid ? formatVnd(stats.paid, locale) : "—"}</Stat>
        <Stat label={t("bestWin")}>{stats.longestWinStreak || "—"}</Stat>
        <Stat label={t("bestLoss")}>{stats.longestLossStreak || "—"}</Stat>
        <Stat label={t("strongest")}>{stats.strongest ? <GameTypeBadge gameType={stats.strongest} /> : "—"}</Stat>
        <Stat label={t("weakest")}>{stats.weakest ? <GameTypeBadge gameType={stats.weakest} /> : "—"}</Stat>
      </dl>
      <div>
        <p className="mb-1 text-xs text-ivory-muted">{t("form")}</p>
        <FormLine form={stats.form} />
      </div>
    </div>
  );
}
