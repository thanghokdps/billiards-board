import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MoneyView, parseGrain, parsePeriod } from "@/features/money";
import { getOverview } from "@/server/stats/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "money" });
  return { title: t("title") };
}

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; grain?: string }>;
}) {
  const query = await searchParams;
  const period = parsePeriod(query.period);
  const grain = parseGrain(query.grain, period);
  const { money } = await getOverview({ period });
  return <MoneyView money={money} period={period} grain={grain} />;
}
