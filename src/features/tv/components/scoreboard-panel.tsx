"use client";

import { useLocale, useTranslations } from "next-intl";

import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { formatDate, formatTime, formatVnd } from "@/lib/domain";
import type { StatMatch, StatPlayer } from "@/lib/stats";

import type { TvData } from "../types";
import { PanelHeading } from "./panel-heading";

const MAX_BOARDS = 6;

function Side({ players, won, align }: { players: StatPlayer[]; won: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", align === "right" && "flex-row-reverse text-right")}>
      <div className={cn("flex shrink-0 -space-x-3", align === "right" && "flex-row-reverse space-x-reverse")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="lg" />
        ))}
      </div>
      <p className={cn("min-w-0 truncate text-xl font-bold 2xl:text-4xl", won ? "text-ivory" : "text-ivory-muted")}>
        {players.map((p) => p.name).join(" & ")}
      </p>
    </div>
  );
}

/** One match as a big LED scoreboard: names either side of the lit score, the winner's digits glowing. */
function LedBoard({ match }: { match: StatMatch }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const aWon = match.winnerSide === "a";
  const hasScore = match.scoreA != null && match.scoreB != null;
  return (
    <article className="flex flex-col justify-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-card 2xl:gap-5 2xl:p-8">
      <div className="flex items-center gap-3 text-sm text-ivory-muted 2xl:text-2xl">
        <GameTypeBadge gameType={match.gameType} className="2xl:px-3 2xl:py-1 2xl:text-lg" />
        <time dateTime={match.playedAt}>{formatTime(match.playedAt, locale)}</time>
        <span className="ml-auto font-semibold">
          {match.bill != null ? formatVnd(match.bill, locale) : t("noBill")}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Side players={match.sideA} won={aWon} align="left" />
        <div
          className="digits flex shrink-0 items-baseline gap-2 rounded-md border border-line-strong bg-night px-4 py-1 text-6xl font-bold 2xl:gap-4 2xl:px-8 2xl:text-8xl"
          aria-label={hasScore ? `${match.scoreA}–${match.scoreB}` : t("noScore")}
        >
          {hasScore ? (
            <>
              <span className={aWon ? "text-lamp digits-glow" : "text-ivory-faint"}>{match.scoreA}</span>
              <span className="text-ivory-faint">:</span>
              <span className={aWon ? "text-ivory-faint" : "text-lamp digits-glow"}>{match.scoreB}</span>
            </>
          ) : (
            <span className="text-4xl text-ivory-faint 2xl:text-7xl">{t("vs")}</span>
          )}
        </div>
        <Side players={match.sideB} won={!aWon} align="right" />
      </div>
    </article>
  );
}

export function ScoreboardPanel({ data }: { data: TvData }) {
  const t = useTranslations("tv.scoreboard");
  const locale = useLocale();
  const shown = data.matches.slice(0, MAX_BOARDS);
  const hidden = data.matches.length - shown.length;
  const heading = (
    <PanelHeading
      title={data.isToday ? t("title") : t("latestTitle")}
      aside={data.shownDate ? formatDate(data.shownDate, locale, "long") : undefined}
    />
  );

  if (shown.length === 0) {
    return (
      <section>
        {heading}
        <EmptyState title={t("empty")} body={t("emptyBody")} className="2xl:py-24" />
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col">
      {heading}
      <div className={cn("grid flex-1 gap-4 2xl:gap-8", shown.length > 1 && "md:grid-cols-2")}>
        {shown.map((match) => (
          <LedBoard key={match.id} match={match} />
        ))}
      </div>
      {hidden > 0 && (
        <p className="mt-3 text-right text-lg font-semibold text-ivory-muted 2xl:text-3xl">
          {t("more", { count: hidden })}
        </p>
      )}
    </section>
  );
}
