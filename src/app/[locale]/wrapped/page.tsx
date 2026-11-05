import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FilterLinks } from "@/components/ui/filter-links";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { WrappedRing } from "@/features/wrapped";
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
  const [t, index] = await Promise.all([
    getTranslations("wrapped"),
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
        <WrappedRing entries={index.players} year={index.year} />
      )}
    </div>
  );
}
