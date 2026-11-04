import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState, PageHeader } from "@/components/ui/misc";
import type { HeadToHead, StatMatch } from "@/lib/stats";

import { MeetingHistory, StreakCard, TypeSplitCard } from "./rivalry-details";
import { RivalryHero } from "./rivalry-hero";
import { RivalryPoster } from "./rivalry-poster";
import { rivalryBreakdown } from "../lib/breakdown";

interface RivalryViewProps {
  /** The most balanced pair, or null while no pair has met enough times. */
  rivalry: HeadToHead | null;
  /** Every match, for the per-type split. */
  matches: StatMatch[];
}

export async function RivalryView({ rivalry, matches }: RivalryViewProps) {
  const [t, locale] = await Promise.all([getTranslations("rivalry"), getLocale()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} className="mb-0" />
      {rivalry ? (
        <Matchup h={rivalry} matches={matches} locale={locale} />
      ) : (
        <EmptyState title={t("empty.title")} body={t("empty.body")} />
      )}
    </div>
  );
}

function Matchup({ h, matches, locale }: { h: HeadToHead; matches: StatMatch[]; locale: string }) {
  const { byGameType, streak } = rivalryBreakdown(h, matches);
  return (
    <>
      <RivalryHero h={h} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <StreakCard streak={streak} />
            <TypeSplitCard h={h} byGameType={byGameType} />
          </div>
          <MeetingHistory h={h} />
        </div>
        <RivalryPoster src={`/api/poster/rivalry?locale=${locale}`} a={h.a.name} b={h.b.name} />
      </div>
    </>
  );
}
