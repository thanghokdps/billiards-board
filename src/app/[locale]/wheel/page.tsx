import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/misc";
import { WheelStudio } from "@/features/wheel";
import { isAdmin } from "@/server/auth/session";
import { listPlayers, toPlayerRef } from "@/server/players/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wheel" });
  return { title: t("title") };
}

export default async function WheelPage() {
  const t = await getTranslations("wheel");
  const [roster, admin] = await Promise.all([listPlayers(), isAdmin()]);
  const players = roster.map(toPlayerRef);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} />
      <WheelStudio players={players} admin={admin} />
    </div>
  );
}
