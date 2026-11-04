import { Flame } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { MatchRow } from "@/components/ui/match-row";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/domain";
import type { HeadToHead } from "@/lib/stats";

import type { RivalryBreakdown } from "../lib/breakdown";

export function StreakCard({ streak }: { streak: RivalryBreakdown["streak"] }) {
  const t = useTranslations("rivalry");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("streak")}</CardTitle>
      </CardHeader>
      <CardBody>
        {streak ? (
          <div className="flex items-center gap-3">
            <PlayerAvatar player={streak.player} size="md" />
            <p className="flex-1 text-sm">{t("streakLine", { name: streak.player.name, count: streak.length })}</p>
            <Flame className="size-6 shrink-0 text-lamp" aria-hidden />
          </div>
        ) : (
          <p className="text-sm text-ivory-muted">{t("streakNone")}</p>
        )}
      </CardBody>
    </Card>
  );
}

export function TypeSplitCard({ h, byGameType }: { h: HeadToHead; byGameType: RivalryBreakdown["byGameType"] }) {
  const t = useTranslations("rivalry");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("byType")}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="space-y-3">
          {byGameType.map(({ gameType, aWins, bWins, played }) => (
            <li key={gameType} className="flex items-center justify-between gap-3">
              <GameTypeBadge gameType={gameType} />
              {played === 0 ? (
                <span className="text-sm text-ivory-faint">{t("byTypeEmpty")}</span>
              ) : (
                <span
                  className="flex items-baseline gap-1.5 digits text-xl font-bold"
                  aria-label={`${h.a.name} ${aWins} – ${bWins} ${h.b.name}`}
                >
                  <span className={cn(aWins > bWins ? "text-lamp" : "text-ivory")}>{aWins}</span>
                  <span className="text-ivory-faint">:</span>
                  <span className={cn(bWins > aWins ? "text-lamp" : "text-ivory")}>{bWins}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function MeetingHistory({ h }: { h: HeadToHead }) {
  const t = useTranslations("rivalry");
  const locale = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history")}</CardTitle>
      </CardHeader>
      <CardBody>
        <ol className="divide-y divide-line">
          {h.recent.map((match) => (
            <li key={match.id} className="pt-3 first:pt-0">
              <time dateTime={match.date} className="block text-xs font-medium text-ivory-muted">
                {formatDate(match.date, locale)}
              </time>
              <MatchRow match={{ ...match, note: null }} compact />
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
