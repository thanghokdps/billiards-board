import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RivalryView } from "@/features/rivalry";
import { getOverview, loadBoard } from "@/server/stats/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rivalry" });
  return { title: t("title") };
}

export default async function RivalryPage() {
  // `loadBoard()` is request-cached, so this shares the load that `getOverview()` already did.
  const [{ rivalry }, { all }] = await Promise.all([getOverview(), loadBoard()]);
  return <RivalryView rivalry={rivalry} matches={all} />;
}
