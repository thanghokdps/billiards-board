import { Flame, Snowflake } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/misc";
import { FormLine, SectionTitle } from "@/features/leaderboard";
import { formatPercent } from "@/lib/domain";
import type { PlayerStats } from "@/lib/stats";

/** Last 10 results, current and record streaks, and the headline numbers. */
export function FormPanel({ stats }: { stats: PlayerStats }) {
  const t = useTranslations("player.form");
  const common = useTranslations("common");
  const locale = useLocale();
  const streak = stats.current;
  return (
    <section aria-labelledby="form-title">
      <Card>
        <CardHeader>
          <SectionTitle id="form-title">{t("title")}</SectionTitle>
          <span className="text-2xs text-ivory-faint">{t("last")}</span>
        </CardHeader>
        <CardBody className="space-y-4">
          {stats.played === 0 ? (
            <p className="text-sm text-ivory-muted">{t("empty")}</p>
          ) : (
            <>
              <FormLine form={stats.form} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                <Stat
                  label={common("played")}
                  value={stats.played}
                  hint={common("record", { wins: stats.wins, losses: stats.losses })}
                />
                <Stat label={common("winRate")} value={formatPercent(stats.winRate, locale)} accent />
                <Stat label={t("avgPoints")} value={stats.avgPoints == null ? "—" : stats.avgPoints.toFixed(1)} />
                <Stat
                  label={t("current")}
                  value={
                    streak ? (
                      <span className="inline-flex items-center gap-1">
                        {streak.result === "W" ? (
                          <Flame className="size-6 text-lamp" aria-hidden />
                        ) : (
                          <Snowflake className="size-6 text-cold" aria-hidden />
                        )}
                        {streak.length}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                  hint={
                    streak
                      ? common(streak.result === "W" ? "streakHot" : "streakCold", { count: streak.length })
                      : undefined
                  }
                />
                <Stat label={t("longestWin")} value={stats.longestWinStreak} />
                <Stat label={t("longestLoss")} value={stats.longestLossStreak} />
                <Stat label={t("sessions")} value={stats.sessionsAttended} />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
