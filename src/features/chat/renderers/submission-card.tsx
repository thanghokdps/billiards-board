"use client";

import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { MatchRow } from "@/components/ui/match-row";
import type { SubmissionCardData, SubmissionList } from "@/lib/agent-results";
import { formatCompactVnd, GUEST_SEAT } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { SeatView } from "@/server/submissions/schema";

/** A typed guest has no `players` row yet, so it gets a negative id here: unique among the seats, never a real one. */
function refsOf(seats: SeatView[], firstId: number): PlayerRef[] {
  return seats.map((seat, i) =>
    "isNew" in seat ? { ...GUEST_SEAT, id: firstId - i, slug: "", name: seat.name } : seat,
  );
}

const newGuestNames = (data: Pick<SubmissionCardData, "sideA" | "sideB">) =>
  [...data.sideA, ...data.sideB].flatMap((seat) => ("isNew" in seat ? [seat.name] : []));

/** The submission as a match row (what approving will record), plus who sent it and which guests get created. */
export function SubmissionBody({ submission }: { submission: SubmissionCardData }) {
  const t = useTranslations("chat.submission");
  const sideA = refsOf(submission.sideA, -1);
  const sideB = refsOf(submission.sideB, -1 - sideA.length);
  const seated = [...sideA, ...sideB];
  const guests = newGuestNames(submission);
  return (
    <MatchRow
      compact={false}
      match={{
        gameType: submission.gameType,
        format: submission.format,
        sideA,
        sideB,
        winnerSide: submission.winnerSide,
        scoreA: submission.scoreA,
        scoreB: submission.scoreB,
        scores: (submission.scores ?? []).map((score, i) => ({ playerId: seated[i]?.id ?? 0, score })),
        bill: submission.bill,
        tags: [],
        note: null,
      }}
      footer={
        (submission.submitter || guests.length > 0) && (
          <p className="mt-2 text-xs text-ivory-muted">
            {submission.submitter && t("by", { name: submission.submitter })}
            {submission.submitter && guests.length > 0 && " · "}
            {guests.length > 0 && t("newGuests", { names: guests.join(", ") })}
          </p>
        )
      }
    />
  );
}

function ageText(minutes: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "vi", { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (minutes < 24 * 60) return rtf.format(-Math.round(minutes / 60), "hour");
  return rtf.format(-Math.round(minutes / (24 * 60)), "day");
}

/** The pending queue the admin asked about: one compact row each, numbered like the model and the admin say them. */
export function SubmissionsList({ result }: { result: SubmissionList }) {
  const t = useTranslations("chat.submission");
  const locale = useLocale();
  if (result.total === 0) return null;
  return (
    <Card className="chat-card my-2">
      <p className="border-b border-line px-4 py-3 font-display text-lg font-bold leading-tight">
        {t("pending", { count: result.total })}
      </p>
      <ul className="divide-y divide-line px-3">
        {result.submissions.map((s) => (
          <li key={s.label} className="flex items-start gap-2 py-2.5">
            <span className="digits w-7 shrink-0 pt-0.5 text-sm font-bold text-lamp">{s.label}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight wrap-anywhere">{s.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ivory-muted">
                <GameTypeBadge gameType={s.gameType} />
                {s.score && <span>{s.score}</span>}
                {s.bill != null && <span>{formatCompactVnd(s.bill, locale)}</span>}
                {s.submitter && <span>{t("by", { name: s.submitter })}</span>}
                {s.newGuests.length > 0 && <span>{t("newGuests", { names: s.newGuests.join(", ") })}</span>}
                <span>{ageText(s.ageMinutes, locale)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      {result.total > result.submissions.length && (
        <p className="border-t border-line px-4 py-2 text-xs text-ivory-muted">
          {t("more", { count: result.total - result.submissions.length })}
        </p>
      )}
    </Card>
  );
}
