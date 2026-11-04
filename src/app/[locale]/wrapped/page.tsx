import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Card, CardBody } from "@/components/ui/card";
import { FilterLinks } from "@/components/ui/filter-links";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { formatPercent } from "@/lib/domain";
import { getWrappedIndex } from "@/server/stats/wrapped";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wrapped");
  return { title: t("title") };
}

export default async function WrappedIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const { year: rawYear } = await searchParams;
  const [t, common, locale, index] = await Promise.all([
    getTranslations("wrapped"),
    getTranslations("common"),
    getLocale(),
    getWrappedIndex(typeof rawYear === "string" ? rawYear : undefined),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={`${t("title")} ${index.year}`} kicker={t("kicker")} />
      <p className="max-w-prose text-sm text-ivory-muted">{t("index.intro")}</p>
      <FilterLinks
        label={t("yearFilter")}
        current={String(index.year)}
        options={index.years.map((y) => ({ value: String(y), label: String(y), href: `/wrapped?year=${y}` }))}
      />
      {index.players.length === 0 ? (
        <EmptyState title={t("index.emptyTitle", { year: index.year })} body={t("index.emptyBody")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {index.players.map(({ player, played, winRate }) => (
            <li key={player.id}>
              <Link
                href={`/wrapped/${player.slug}?year=${index.year}`}
                aria-label={t("index.open", { name: player.name, year: index.year })}
                className="block rounded-lg"
              >
                <Card
                  className="border-t-4 transition-colors hover:border-lamp/40"
                  style={{ borderTopColor: player.ballColor }}
                >
                  <CardBody className="flex items-center gap-4">
                    <PlayerAvatar player={player} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-bold uppercase tracking-wide">{player.name}</p>
                      {player.nickname && <p className="truncate text-xs text-ivory-muted">{player.nickname}</p>}
                      <p className="mt-1 text-sm text-ivory-muted">
                        {t("index.card", {
                          matches: common("matches", { count: played }),
                          winRate: formatPercent(winRate, locale),
                        })}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
