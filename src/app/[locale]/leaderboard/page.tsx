import { getTranslations } from "next-intl/server";

import { RackBreak } from "@/components/ui/billiard-art";
import { FilterLinks } from "@/components/ui/filter-links";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { EloSection, H2hHeatmap, PocketTable, Podium, rankPlayers } from "@/features/leaderboard";
import { GAME_LABEL, GAME_TYPES, periodStart, type GameType, type Period } from "@/lib/domain";
import { getOverview } from "@/server/stats/service";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["all", "week", "month", "year"];

interface Props {
  searchParams: Promise<{ type?: string; period?: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations("leaderboard");
  return { title: t("metaTitle") };
}

function parseFilters({ type, period }: { type?: string; period?: string }) {
  return {
    gameType: GAME_TYPES.find((g) => g === type) ?? null,
    period: PERIODS.find((p) => p === period) ?? "all",
  } satisfies { gameType: GameType | null; period: Period };
}

const hrefFor = (gameType: GameType | null, period: Period) => {
  const query = new URLSearchParams();
  if (gameType) query.set("type", gameType);
  if (period !== "all") query.set("period", period);
  const qs = query.toString();
  return qs ? `/leaderboard?${qs}` : "/leaderboard";
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const { gameType, period } = parseFilters(await searchParams);
  const [t, common, overview] = await Promise.all([
    getTranslations("leaderboard"),
    getTranslations("common"),
    getOverview({ period, gameType }),
  ]);

  const ranked = rankPlayers(overview.stats);
  const top = ranked.filter((s) => s.played > 0).slice(0, 3);
  const from = periodStart(period, overview.today);
  const eloHistory = overview.elo.history
    .filter((h) => !from || h.date >= from)
    .map(({ date, ratings }) => ({ date, ratings }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} actions={<RackBreak />} />

      <div className="space-y-2">
        <FilterLinks
          label={t("filters.gameType")}
          current={gameType ?? "all"}
          options={[
            { value: "all", label: common("allGames"), href: hrefFor(null, period) },
            ...GAME_TYPES.map((g) => ({ value: g, label: GAME_LABEL[g], href: hrefFor(g, period) })),
          ]}
        />
        <FilterLinks
          label={t("filters.period")}
          current={period}
          options={PERIODS.map((p) => ({ value: p, label: common(`period.${p}`), href: hrefFor(gameType, p) }))}
        />
        <p aria-live="polite" className="text-xs text-ivory-muted">
          {t("summary", {
            game: gameType ? GAME_LABEL[gameType] : common("allGames"),
            period: common(`period.${period}`),
            count: overview.matchCount,
          })}
        </p>
      </div>

      {top.length === 0 ? (
        <EmptyState title={t("empty.title")} body={t("empty.body")} />
      ) : (
        <>
          <Podium top={top} />
          <PocketTable ranked={ranked} />
          <EloSection players={overview.players} history={eloHistory} />
          <H2hHeatmap players={overview.players} matrix={overview.matrix} />
        </>
      )}
    </div>
  );
}
