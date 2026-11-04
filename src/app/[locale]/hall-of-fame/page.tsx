import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FameView } from "@/features/fame";
import { getHallOfFame } from "@/server/stats/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fame" });
  return { title: t("title") };
}

export default async function HallOfFamePage() {
  return <FameView data={await getHallOfFame()} />;
}
