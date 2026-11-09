import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SwingLamp } from "@/components/ui/billiard-art";
import { PageHeader } from "@/components/ui/misc";
import { MemberSubmit, SignInPlate } from "@/features/submit";
import { googleConfigured } from "@/server/auth/google";
import { readPlayer } from "@/server/auth/player-session";
import { HttpError } from "@/server/http";
import { listPlayers, toPlayerRef } from "@/server/players/repository";
import { getOwnTemp } from "@/server/submissions/temp-matches";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });
  return { title: t("title") };
}

/** A temp match the member sits in, or a 404 for any other id; no id means a new match. */
async function ownMatch(caller: NonNullable<Awaited<ReturnType<typeof readPlayer>>>, id: string | undefined) {
  if (!id) return null;
  try {
    return await getOwnTemp(caller, id);
  } catch (error) {
    if (error instanceof HttpError && error.code === "not_found") notFound();
    throw error;
  }
}

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const [t, caller, { id }] = await Promise.all([getTranslations("submit"), readPlayer(), searchParams]);

  let body;
  if (!caller) {
    body = <SignInPlate googleEnabled={googleConfigured()} />;
  } else {
    const [roster, match] = await Promise.all([
      listPlayers().then((rows) => rows.map(toPlayerRef)),
      ownMatch(caller, typeof id === "string" ? id : undefined),
    ]);
    body = <MemberSubmit key={match?.view.id ?? "new"} roster={roster} me={caller.player} match={match} />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} actions={<SwingLamp />} />
      {body}
    </div>
  );
}
