import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState, PageHeader } from "@/components/ui/misc";
import {
  ChatButton,
  localHour,
  PairingCard,
  RecapCard,
  RECAP_FROM_HOUR,
  Scoreboard,
  Section,
  SessionCard,
  SessionEditor,
  suggestPairings,
  summarizeDay,
  WantedStrip,
} from "@/features/home";
import { PredictionCard, toCardData } from "@/features/predictions";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/domain";
import { isAdmin } from "@/server/auth/session";
import { listPredictions } from "@/server/predictions/repository";
import { getSessionByDate } from "@/server/sessions/repository";
import { getOverview, getToday } from "@/server/stats/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("title") };
}

export default async function HomePage() {
  const [t, locale, admin, overview, board] = await Promise.all([
    getTranslations("home"),
    getLocale(),
    isAdmin(),
    getOverview(),
    getToday(),
  ]);
  const [session, predictions] = await Promise.all([getSessionByDate(board.today), listPredictions(50)]);

  const roster = overview.players;
  const byId = new Map(roster.map((p) => [p.id, p]));
  const attendeeIds = session?.attendees ?? [];
  const attendees = roster.filter((p) => attendeeIds.includes(p.id));
  const ratings = Object.fromEntries(overview.elo.ratings);
  const pairings = suggestPairings(attendees, ratings);
  const streaks = Object.fromEntries(board.stats.map((s) => [s.player.id, s.current]));
  const openToday = predictions
    .filter((p) => p.status === "open" && p.date === board.today)
    .map((p) => toCardData(p, byId))
    .filter((p) => p !== null);
  const showRecap = board.isToday && localHour() >= RECAP_FROM_HOUR;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={formatDate(board.today, locale, "long")} />

      {showRecap && (
        <Section title={t("recap.title")}>
          <RecapCard date={board.today} summary={summarizeDay(board.matches)} admin={admin} />
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title={t("session.title")}
          action={
            admin && (
              <SessionEditor
                date={board.today}
                roster={roster}
                attendeeIds={attendeeIds}
                venue={session?.venue ?? null}
                tableLabel={session?.tableLabel ?? null}
              />
            )
          }
        >
          <SessionCard
            date={board.today}
            venue={session?.venue ?? null}
            tableLabel={session?.tableLabel ?? null}
            totalBill={board.isToday ? board.totalBill : 0}
            attendees={attendees}
          />
        </Section>

        {(pairings.length > 0 || admin) && (
          <Section title={t("pairing.title")}>
            {pairings.length > 0 ? (
              <PairingCard options={pairings} admin={admin} />
            ) : (
              <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-ivory-muted">
                {t("pairing.hint")}
              </p>
            )}
          </Section>
        )}
      </div>

      <Section title={t("scoreboard.title")}>
        <div className="space-y-4">
          {!board.isToday && (
            <EmptyState
              title={t("scoreboard.empty")}
              body={admin ? t("scoreboard.emptyBody") : t("scoreboard.emptyViewerBody")}
              action={admin && <ChatButton label={t("scoreboard.openAssistant")} variant="primary" size="md" />}
            />
          )}
          {board.shownDate && board.matches.length > 0 && (
            <div className="space-y-2.5">
              {!board.isToday && (
                <p className="text-sm font-semibold text-ivory-muted">
                  {t("scoreboard.lastSession", { date: formatDate(board.shownDate, locale, "long") })}
                </p>
              )}
              <Scoreboard matches={board.matches} streaks={streaks} specials={board.specials} admin={admin} />
            </div>
          )}
        </div>
      </Section>

      {overview.wanted.length > 0 && (
        <Section title={t("wanted.title")}>
          <WantedStrip entries={overview.wanted} />
        </Section>
      )}

      <Section
        title={t("predictions.title")}
        action={
          <Link href="/predictions" className="text-sm font-semibold text-lamp underline-offset-2 hover:underline">
            {t("predictions.seeAll")}
          </Link>
        }
      >
        {openToday.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {openToday.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-ivory-muted">
            {t("predictions.empty")}
          </p>
        )}
      </Section>
    </div>
  );
}
