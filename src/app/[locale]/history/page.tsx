import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { CueShot } from "@/components/ui/billiard-art";
import { Button } from "@/components/ui/button";
import { FilterLinks } from "@/components/ui/filter-links";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { HistoryList, toHighlightItems, type HistoryDay } from "@/features/history";
import { Link } from "@/i18n/navigation";
import { formatVnd, GAME_LABEL, GAME_TYPES, type GameType, type Period } from "@/lib/domain";
import { isAdmin } from "@/server/auth/session";
import { highlightsFor } from "@/server/highlights/repository";
import { findMatches } from "@/server/matches/repository";
import { getHistory } from "@/server/stats/service";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["week", "month", "year", "all"];
const DEFAULT_PERIOD: Period = "all";

type SearchParams = Promise<{ game?: string | string[]; period?: string | string[] }>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function parseGame(value: string | undefined): GameType | null {
  return GAME_TYPES.find((g) => g === value) ?? null;
}

function parsePeriod(value: string | undefined): Period {
  return PERIODS.find((p) => p === value) ?? DEFAULT_PERIOD;
}

/** Defaults are left out of the URL so the unfiltered page keeps a clean `/history`. */
function hrefFor(game: GameType | null, period: Period): string {
  const query = new URLSearchParams();
  if (game) query.set("game", game);
  if (period !== DEFAULT_PERIOD) query.set("period", period);
  const text = query.toString();
  return text ? `/history?${text}` : "/history";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");
  return { title: t("title") };
}

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const game = parseGame(first(query.game));
  const period = parsePeriod(first(query.period));

  const [t, tc, locale, admin, rawDays] = await Promise.all([
    getTranslations("history"),
    getTranslations("common"),
    getLocale(),
    isAdmin(),
    getHistory({ gameType: game, period }),
  ]);

  // shortcut: every match of the range is rendered at once, fine for a friends' group; paginate by day past ~1000 matches.
  const ids = rawDays.flatMap((d) => d.matches.map((m) => m.id));
  const [highlightRows, noteRows] = await Promise.all([highlightsFor(ids), ids.length > 0 ? findMatches({ ids }) : []]);
  const notes = new Map(noteRows.map((m) => [m.id, m.note]));
  const days: HistoryDay[] = rawDays.map((d) => ({
    ...d,
    matches: d.matches.map((m) => ({ ...m, note: notes.get(m.id) ?? null })),
  }));
  const totalBill = days.reduce((sum, d) => sum + d.bill, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} actions={<CueShot />} />

      <div className="space-y-3">
        <FilterLinks
          label={t("filters.game")}
          current={game ?? "all"}
          options={[
            { value: "all", label: tc("allGames"), href: hrefFor(null, period) },
            ...GAME_TYPES.map((g) => ({ value: g, label: GAME_LABEL[g], href: hrefFor(g, period) })),
          ]}
        />
        <FilterLinks
          label={t("filters.period")}
          current={period}
          options={PERIODS.map((p) => ({ value: p, label: tc(`period.${p}`), href: hrefFor(game, p) }))}
        />
      </div>

      <p aria-live="polite" className="text-sm text-ivory-muted">
        {t("summary", { matches: tc("matches", { count: ids.length }), bill: formatVnd(totalBill, locale) })}
      </p>

      {days.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          body={t("empty.body")}
          action={
            <Button asChild variant="outline">
              <Link href="/history">{t("empty.reset")}</Link>
            </Button>
          }
        />
      ) : (
        <HistoryList days={days} highlights={toHighlightItems(highlightRows)} admin={admin} />
      )}
    </div>
  );
}
