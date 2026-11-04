import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { WrappedStory } from "@/features/wrapped";
import { Link } from "@/i18n/navigation";
import { getWrappedStory } from "@/server/stats/wrapped";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string | string[] }>;
};

async function loadStory({ params, searchParams }: Props) {
  const [{ slug }, { year }] = await Promise.all([params, searchParams]);
  return getWrappedStory(slug, typeof year === "string" ? year : undefined);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [t, story] = await Promise.all([getTranslations("wrapped"), loadStory(props)]);
  return { title: story ? t("metaTitle", { name: story.player.name, year: story.year }) : t("title") };
}

export default async function WrappedStoryPage(props: Props) {
  const [t, story] = await Promise.all([getTranslations("wrapped"), loadStory(props)]);
  if (!story) notFound();

  if (story.played === 0) {
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center px-4">
        <EmptyState
          className="w-full max-w-md"
          title={t("story.emptyTitle", { name: story.player.name, year: story.year })}
          body={t("story.emptyBody")}
          action={
            <Button asChild>
              <Link href={`/wrapped?year=${story.year}`}>{t("story.back")}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return <WrappedStory story={story} />;
}
