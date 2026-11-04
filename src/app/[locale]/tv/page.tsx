import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildTvData, TvScreen } from "@/features/tv";
import { getToday } from "@/server/stats/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tv" });
  return { title: t("title") };
}

export default async function TvPage() {
  const { shownDate, isToday, matches, stats } = await getToday();
  return <TvScreen data={buildTvData({ shownDate, isToday, matches, stats })} />;
}
