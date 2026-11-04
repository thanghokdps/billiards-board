import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { EmptyState, PageHeader } from "@/components/ui/misc";
import { matchTitle } from "@/lib/domain";
import type { getHallOfFame } from "@/server/stats/service";

import { Achievements } from "./achievements";
import { PosterGallery, type GalleryPoster } from "./poster-gallery";
import { RecordsSection } from "./records-section";
import { WrappedCard } from "./wrapped-card";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-bold leading-tight">{title}</h2>
      {children}
    </section>
  );
}

export async function FameView({ data }: { data: Awaited<ReturnType<typeof getHallOfFame>> }) {
  const [t, common, locale] = await Promise.all([getTranslations("fame"), getTranslations("common"), getLocale()]);

  const posters: GalleryPoster[] = data.posters.map(({ match, reason }) => ({
    matchId: match.id,
    reason: reason!,
    date: match.date,
    sides: matchTitle(match, common("vs")),
    src: `/api/poster/match/${match.id}?locale=${locale}`,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} className="mb-0" />

      <Section title={t("records")}>
        <RecordsSection records={data.records} />
      </Section>

      <Section title={t("posters")}>
        {posters.length === 0 ? (
          <EmptyState title={t("postersEmpty.title")} body={t("postersEmpty.body")} />
        ) : (
          <PosterGallery posters={posters} />
        )}
      </Section>

      <Section title={t("achievements")}>
        <Achievements players={data.players} achievements={data.achievements} />
      </Section>

      <WrappedCard />
    </div>
  );
}
