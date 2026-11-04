import { useLocale, useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatTime, formatVnd } from "@/lib/domain";
import type { MatchView, PlayerRef } from "@/server/matches/schema";

import { GameTypeBadge } from "./game-type-badge";
import { PlayerAvatar, type Streak } from "./player-avatar";

interface MatchRowProps {
  match: Pick<
    MatchView,
    "gameType" | "format" | "sideA" | "sideB" | "winnerSide" | "scoreA" | "scoreB" | "scores" | "bill" | "tags" | "note"
  > & {
    playedAt?: string;
  };
  streaks?: Record<number, Streak | null>;
  /** Extra line under the board (special-match badge, actions). */
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
}

function Side({
  players,
  won,
  align,
  streaks,
  winLabel,
  lossLabel,
}: {
  players: PlayerRef[];
  won: boolean;
  align: "left" | "right";
  streaks?: MatchRowProps["streaks"];
  winLabel: string;
  lossLabel?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", align === "right" && "flex-row-reverse text-right")}>
      <div className={cn("flex", align === "right" ? "flex-row-reverse -space-x-reverse" : "", "-space-x-2")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="sm" streak={streaks?.[p.id]} />
        ))}
      </div>
      <div className="min-w-0">
        {/* A 2v2 side wraps: truncating two names on a phone left only initials next to the avatars. */}
        <p className={cn("font-bold leading-tight wrap-anywhere", won ? "text-ivory" : "text-ivory-muted")}>
          {players.map((p) => p.name).join(" & ")}
        </p>
        {won && <p className="text-2xs font-semibold text-lamp">{winLabel}</p>}
        {!won && lossLabel && <p className="text-2xs font-semibold text-loss">{lossLabel}</p>}
      </div>
    </div>
  );
}

/**
 * A 1v1v1 in the same anatomy as a 1v1: winners left, loser right, the score board between them.
 * Too narrow for that (phone, chat card), the three seats share a line and the board drops below.
 * Measured on the container because the chat card is narrow at any viewport width.
 */
function ThreeWayBoard({
  match,
  streaks,
  lossLabel,
}: Pick<MatchRowProps, "match" | "streaks"> & { lossLabel?: string }) {
  const t = useTranslations("common");
  const seats = [...match.sideA, ...match.sideB];
  const scores = seats.flatMap((p) => match.scores.filter((s) => s.playerId === p.id));
  const seat = (player: PlayerRef, won: boolean) => (
    <Side
      key={player.id}
      players={[player]}
      won={won}
      align={won ? "left" : "right"}
      streaks={streaks}
      winLabel={t("win")}
      lossLabel={lossLabel}
    />
  );
  return (
    <div className="@container">
      <div className="grid grid-cols-3 items-center gap-2 @xl:grid-cols-[1fr_auto_1fr]">
        <div className="contents @xl:flex @xl:gap-2">{match.sideA.map((p) => seat(p, true))}</div>
        <div
          className={cn(
            "order-last col-span-3 flex items-baseline gap-1 justify-self-center rounded-sm bg-night px-2.5 py-1 digits text-3xl font-bold @xl:order-none @xl:col-span-1",
            scores.length === 0 && "hidden @xl:flex",
          )}
          aria-label={scores.length > 0 ? scores.map((s) => s.score).join("–") : t("noScore")}
        >
          {scores.length > 0 ? (
            scores.map((s, i) => (
              <Fragment key={s.playerId}>
                {i > 0 && <span className="text-ivory-faint">:</span>}
                <span
                  className={
                    match.sideA.some((p) => p.id === s.playerId) ? "text-lamp digits-glow" : "text-ivory-faint"
                  }
                >
                  {s.score}
                </span>
              </Fragment>
            ))
          ) : (
            <span className="px-1 text-base text-ivory-faint">{t("vs")}</span>
          )}
        </div>
        {match.sideB.map((p) => seat(p, false))}
      </div>
    </div>
  );
}

/** One match as a flat scoreboard row: side A, score, side B, the winner lit. Lists separate rows with `divide-y`. */
export function MatchRow({ match, streaks, footer, compact, className }: MatchRowProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const aWon = match.winnerSide === "a";
  const hasScore = match.scoreA != null && match.scoreB != null;
  // No bill on the match means nobody paid, so the loser carries no label.
  const lossLabel = match.bill != null ? t("paysBill") : undefined;
  return (
    <article className={cn("py-3", className)}>
      <div className="mb-2 flex items-center gap-2 text-2xs text-ivory-muted">
        <GameTypeBadge gameType={match.gameType} />
        {match.playedAt && <time dateTime={match.playedAt}>{formatTime(match.playedAt, locale)}</time>}
        <span className="ml-auto font-semibold text-ivory-muted">
          {match.bill != null ? formatVnd(match.bill, locale) : t("noBill")}
        </span>
      </div>
      {match.format === "1v1v1" ? (
        <ThreeWayBoard match={match} streaks={streaks} lossLabel={lossLabel} />
      ) : (
        <div className="flex items-center gap-2">
          <Side
            players={match.sideA}
            won={aWon}
            align="left"
            streaks={streaks}
            winLabel={t("win")}
            lossLabel={lossLabel}
          />
          <div
            className="flex shrink-0 items-baseline gap-1 rounded-sm bg-night px-2.5 py-1 digits text-3xl font-bold"
            aria-label={hasScore ? `${match.scoreA}–${match.scoreB}` : t("noScore")}
          >
            {hasScore ? (
              <>
                <span className={aWon ? "text-lamp digits-glow" : "text-ivory-faint"}>{match.scoreA}</span>
                <span className="text-ivory-faint">:</span>
                <span className={!aWon ? "text-lamp digits-glow" : "text-ivory-faint"}>{match.scoreB}</span>
              </>
            ) : (
              <span className="px-1 text-base text-ivory-faint">{t("vs")}</span>
            )}
          </div>
          <Side
            players={match.sideB}
            won={!aWon}
            align="right"
            streaks={streaks}
            winLabel={t("win")}
            lossLabel={lossLabel}
          />
        </div>
      )}
      {!compact && (match.tags.length > 0 || match.note) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ivory-muted">
          {match.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-felt/25 px-2 py-0.5 font-semibold text-win">
              {tag}
            </span>
          ))}
          {match.note && <span className="italic">“{match.note}”</span>}
        </div>
      )}
      {footer}
    </article>
  );
}
