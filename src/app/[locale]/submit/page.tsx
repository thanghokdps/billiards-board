import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SwingLamp } from "@/components/ui/billiard-art";
import { PageHeader } from "@/components/ui/misc";
import { SubmitScene } from "@/features/submit";
import { listPlayers, toPlayerRef } from "@/server/players/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });
  return { title: t("title") };
}

export default async function SubmitPage() {
  const t = await getTranslations("submit");
  const roster = (await listPlayers()).map(toPlayerRef);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} actions={<SwingLamp />} />
      <SubmitScene roster={roster} />
    </div>
  );
}
