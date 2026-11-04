"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { formatDate, formatTime, formatVnd } from "@/lib/domain";
import type { StatMatch, StatPlayer } from "@/lib/stats";

import type { TvData } from "../types";
import { PanelHeading } from "./panel-heading";

const MAX_BOARDS = 6;

function Side({
  players,
  won,
  align,
  label,
}: {
  players: StatPlayer[];
  won: boolean;
  align: "left" | "right";
  label?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", align === "right" && "flex-row-reverse text-right")}>
      <div className={cn("flex shrink-0 -space-x-3", align === "right" && "flex-row-reverse space-x-reverse")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="lg" />
        ))}
      </div>
      <div className="min-w-0">
        <p className={cn("truncate text-xl font-bold 2xl:text-4xl", won ? "text-ivory" : "text-ivory-muted")}>
          {players.map((p) => p.name).join(" & ")}
        </p>
        {label && <p className={cn("font-semibold 2xl:text-2xl", won ? "text-lamp" : "text-loss")}>{label}</p>}
      </div>
    </div>
  );
}

/** A 1v1v1 on the TV: the same seats as a 1v1, one LED below because three names and three scores won't fit a line. */
function ThreeWayBoard({ match, lossLabel }: { match: StatMatch; lossLabel?: string }) {
  const t = useTranslations("common");
  const scores = [...match.sideA, ...match.sideB].flatMap((p) => match.scores.filter((s) => s.playerId === p.id));
  return (
    <div className="flex flex-col items-center gap-3 2xl:gap-5">
      <div className="flex w-full items-center gap-4">
        {match.sideA.map((p) => (
          <Side key={p.id} players={[p]} won align="left" label={t("win")} />
        ))}
        {match.sideB.map((p) => (
          <Side key={p.id} players={[p]} won={false} align="right" label={lossLabel} />
        ))}
      </div>
      {scores.length > 0 && (
        <div
          className="digits flex shrink-0 items-baseline gap-2 rounded-md border border-line-strong bg-night px-4 py-1 text-6xl font-bold 2xl:gap-4 2xl:px-8 2xl:text-8xl"
          aria-label={scores.map((s) => s.score).join("–")}
        >
          {scores.map((s, i) => (
            <Fragment key={s.playerId}>
              {i > 0 && <span className="text-ivory-faint">:</span>}
              <span
                className={match.sideA.some((p) => p.id === s.playerId) ? "text-lamp digits-glow" : "text-ivory-faint"}
              >
                {s.score}
              </span>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/** One match as a big LED scoreboard: names either side of the lit score, the winner's digits glowing. */
function LedBoard({ match }: { match: StatMatch }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const aWon = match.winnerSide === "a";
  const hasScore = match.scoreA != null && match.scoreB != null;
  const lossLabel = match.bill != null ? t("paysBill") : undefined;
  return (
    <article className="flex flex-col justify-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-card 2xl:gap-5 2xl:p-8">
      <div className="flex items-center gap-3 text-sm text-ivory-muted 2xl:text-2xl">
        <GameTypeBadge gameType={match.gameType} className="2xl:px-3 2xl:py-1 2xl:text-lg" />
        <time dateTime={match.playedAt}>{formatTime(match.playedAt, locale)}</time>
        <span className="ml-auto font-semibold">
          {match.bill != null ? formatVnd(match.bill, locale) : t("noBill")}
        </span>
      </div>
      {match.format === "1v1v1" ? (
        <ThreeWayBoard match={match} lossLabel={lossLabel} />
      ) : (
        <div className="flex items-center gap-4">
          <Side players={match.sideA} won={aWon} align="left" label={aWon ? t("win") : lossLabel} />
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
          <Side players={match.sideB} won={!aWon} align="right" label={aWon ? lossLabel : t("win")} />
        </div>
      )}
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
