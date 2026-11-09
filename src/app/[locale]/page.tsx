import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import {
  ChatButton,
  localHour,
  RecapCard,
  RECAP_FROM_HOUR,
  Scoreboard,
  Section,
  summarizeDay,
  TableHero,
  TempBand,
  WantedStrip,
} from "@/features/home";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/domain";
import { readPlayer } from "@/server/auth/player-session";
import { isAdmin } from "@/server/auth/session";
import { getOverview, getToday } from "@/server/stats/service";
import { listTempBoard } from "@/server/submissions/temp-matches";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("title") };
}

export default async function HomePage() {
  const [t, locale, admin, overview, board, temp, member] = await Promise.all([
    getTranslations("home"),
    getLocale(),
    isAdmin(),
    getOverview(),
    getToday(),
    listTempBoard(),
    readPlayer(),
  ]);
  const showTemp = temp.length > 0 || member !== null;

  const streaks = Object.fromEntries(board.stats.map((s) => [s.player.id, s.current]));
  const showRecap = board.isToday && localHour() >= RECAP_FROM_HOUR;
  const hasWanted = overview.wanted.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <TableHero title={t("title")} date={board.today} totalBill={board.isToday ? board.totalBill : 0} />

      <div className={cn("grid gap-8 lg:items-start", hasWanted && "lg:grid-cols-3")}>
        <div className={cn("space-y-8", hasWanted && "lg:col-span-2")}>
          {showTemp && (
            <Section
              anchor="temp"
              title={t("temp.title")}
              action={
                member && (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/submit">{t("temp.schedule")}</Link>
                  </Button>
                )
              }
            >
              <TempBand matches={temp} meId={member?.player.id ?? null} />
            </Section>
          )}

          <Section title={t("scoreboard.title")}>
            <div className="space-y-4">
              {!board.isToday && (
                <EmptyState
                  title={t("scoreboard.empty")}
                  body={admin ? t("scoreboard.emptyBody") : t("scoreboard.emptyViewerBody")}
                  action={
                    admin ? (
                      <ChatButton label={t("scoreboard.openAssistant")} variant="primary" size="md" />
                    ) : (
                      <Button asChild>
                        <Link href="/wheel">{t("scoreboard.pickPairing")}</Link>
                      </Button>
                    )
                  }
                />
              )}
              {board.shownDate && board.matches.length > 0 && (
                <div>
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

          {showRecap && (
            <Section title={t("recap.title")}>
              <RecapCard date={board.today} summary={summarizeDay(board.matches)} admin={admin} />
            </Section>
          )}
        </div>

        {hasWanted && (
          <Section title={t("wanted.title")}>
            <WantedStrip entries={overview.wanted} />
          </Section>
        )}
      </div>
    </div>
  );
}
