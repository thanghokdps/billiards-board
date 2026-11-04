import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatTime, formatVnd } from "@/lib/domain";
import type { MatchView, PlayerRef } from "@/server/matches/schema";

import { GameTypeBadge } from "./game-type-badge";
import { PlayerAvatar, type Streak } from "./player-avatar";

interface MatchRowProps {
  match: Pick<
    MatchView,
    "gameType" | "sideA" | "sideB" | "winnerSide" | "scoreA" | "scoreB" | "bill" | "tags" | "note"
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
}: {
  players: PlayerRef[];
  won: boolean;
  align: "left" | "right";
  streaks?: MatchRowProps["streaks"];
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", align === "right" && "flex-row-reverse text-right")}>
      <div className={cn("flex", align === "right" ? "flex-row-reverse -space-x-reverse" : "", "-space-x-2")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="sm" streak={streaks?.[p.id]} />
        ))}
      </div>
      <div className="min-w-0">
        <p className={cn("truncate font-bold leading-tight", won ? "text-ivory" : "text-ivory-muted")}>
          {players.map((p) => p.name).join(" & ")}
        </p>
        {won && <p className="font-display text-2xs font-bold uppercase tracking-label text-lamp">★</p>}
      </div>
    </div>
  );
}

/** One match as a scoreboard row: side A · score · side B, the winner lit, bill and tags below. */
export function MatchRow({ match, streaks, footer, compact, className }: MatchRowProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const aWon = match.winnerSide === "a";
  const hasScore = match.scoreA != null && match.scoreB != null;
  return (
    <article className={cn("rounded-md border border-line bg-surface-2/70 px-3 py-3", className)}>
      <div className="mb-2 flex items-center gap-2 text-2xs text-ivory-faint">
        <GameTypeBadge gameType={match.gameType} />
        {match.playedAt && <time dateTime={match.playedAt}>{formatTime(match.playedAt, locale)}</time>}
        <span className="ml-auto font-semibold text-ivory-muted">
          {match.bill != null ? formatVnd(match.bill, locale) : t("noBill")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Side players={match.sideA} won={aWon} align="left" streaks={streaks} />
        <div
          className="flex shrink-0 items-baseline gap-1 rounded-sm bg-night/70 px-2.5 py-1 digits text-2xl font-bold"
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
        <Side players={match.sideB} won={!aWon} align="right" streaks={streaks} />
      </div>
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
