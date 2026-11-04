import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/misc";
import { WheelStudio } from "@/features/wheel";
import { localDate } from "@/lib/domain";
import { isAdmin } from "@/server/auth/session";
import { listPlayers, toPlayerRef } from "@/server/players/repository";
import { getSessionByDate } from "@/server/sessions/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wheel" });
  return { title: t("title") };
}

export default async function WheelPage() {
  const t = await getTranslations("wheel");
  const [roster, session, admin] = await Promise.all([
    listPlayers(),
    getSessionByDate(localDate(new Date())),
    isAdmin(),
  ]);
  const players = roster.map(toPlayerRef);
  const attendees = (session?.attendees ?? []).filter((id) => players.some((p) => p.id === id));
  // Fewer than two attendees cannot make a pairing, so the whole roster is the starting point.
  const defaultIncluded = attendees.length >= 2 ? attendees : players.map((p) => p.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} />
      <WheelStudio players={players} defaultIncluded={defaultIncluded} admin={admin} />
    </div>
  );
}
