"use client";

import { CalendarClock, Hourglass, PenLine } from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { MatchRow } from "@/components/ui/match-row";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { CancelMatch } from "@/features/submissions";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatDate, formatTime, GUEST_SEAT, localDate } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { SeatView, TempMatchView } from "@/server/submissions/schema";

/** A typed guest has no row yet: a negative id keeps it apart from every real player. */
function seatRef(seat: SeatView, index: number): PlayerRef {
  if (!("isNew" in seat)) return seat;
  return { ...GUEST_SEAT, id: -(index + 1), slug: `new-${index}`, name: seat.name };
}

function sidesOf(match: TempMatchView): { sideA: PlayerRef[]; sideB: PlayerRef[] } {
  const refs = [...match.sideA, ...match.sideB].map(seatRef);
  return { sideA: refs.slice(0, match.sideA.length), sideB: refs.slice(match.sideA.length) };
}

function Lineup({ players, align }: { players: PlayerRef[]; align: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", align === "right" && "items-end text-right")}>
      {players.map((p) => (
        <span key={p.id} className={cn("flex min-w-0 items-center gap-2", align === "right" && "flex-row-reverse")}>
          <PlayerAvatar player={p} size="sm" />
          <span className="truncate font-semibold">{p.name}</span>
        </span>
      ))}
    </div>
  );
}

function TempSlip({ match, mine }: { match: TempMatchView; mine: boolean }) {
  const t = useTranslations("home.temp");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { sideA, sideB } = sidesOf(match);
  const pending = match.status === "pending";
  const when = match.scheduledAt
    ? `${formatTime(match.scheduledAt, locale)} · ${formatDate(localDate(new Date(match.scheduledAt)), locale)}`
    : null;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-md border border-line-strong bg-surface px-4 pb-4 shadow-pop"
    >
      <div aria-hidden className={cn("-mx-4 mb-3 h-1.5 rounded-t-md", pending ? "bg-lamp/70" : "bg-chalk/50")} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* A played match's board already carries its game type. */}
        {!pending && <GameTypeBadge gameType={match.gameType} />}
        <span className="text-xs font-semibold text-ivory-muted">{match.format}</span>
        <Badge
          tone={pending ? "lamp" : "neutral"}
          className={cn("ml-auto gap-1", !pending && "border border-dashed border-chalk text-chalk")}
        >
          {pending ? (
            <Hourglass className="size-3.5" aria-hidden />
          ) : (
            <CalendarClock className="size-3.5" aria-hidden />
          )}
          {pending ? t("pending") : when ? t("scheduledAt", { when }) : t("scheduled")}
        </Badge>
      </div>

      {pending && match.result ? (
        <MatchRow
          compact
          match={{
            gameType: match.gameType,
            format: match.format,
            sideA,
            sideB,
            winnerSide: match.result.winnerSide,
            scoreA: match.result.scoreA,
            scoreB: match.result.scoreB,
            scores: match.result.scores?.map((score, i) => ({ playerId: [...sideA, ...sideB][i]!.id, score })) ?? [],
            bill: match.result.bill,
            tags: [],
            note: null,
          }}
        />
      ) : (
        <div className="flex items-center gap-3">
          <Lineup players={sideA} align="left" />
          <span className="font-display text-lg font-bold text-ivory-faint">{tc("vs")}</span>
          <Lineup players={sideB} align="right" />
        </div>
      )}

      {mine && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!pending && <CancelMatch id={match.id} size="sm" onCancelled={() => router.refresh()} />}
          <Button asChild size="sm" variant={pending ? "outline" : "primary"}>
            <Link href={{ pathname: "/submit", query: { id: match.id } }}>
              <PenLine className="size-4" aria-hidden />
              {t(pending ? "editResult" : "enterResult")}
            </Link>
          </Button>
        </div>
      )}
    </motion.li>
  );
}

/** Temp matches everyone can see: still to be played, or played and waiting for the admin; nothing counts yet. */
export function TempBand({ matches, meId }: { matches: TempMatchView[]; meId: number | null }) {
  const t = useTranslations("home.temp");
  if (matches.length === 0) {
    return <p className="text-sm text-ivory-muted">{t("empty")}</p>;
  }
  return (
    <ul className="felt space-y-3 rounded-lg p-3 sm:p-4">
      {matches.map((match) => (
        <TempSlip key={match.id} match={match} mine={meId !== null && match.seatedIds.includes(meId)} />
      ))}
    </ul>
  );
}
