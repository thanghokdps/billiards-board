import { getTranslations } from "next-intl/server";

import { HttpError, route } from "@/server/http";
import { wantedPosterData } from "@/server/posters/data";
import { posterLocale, posterVnd, renderPoster } from "@/server/posters/render";
import { WantedPoster } from "@/server/posters/templates";

export const GET = route(async (request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) throw new HttpError("not_found");
  const data = await wantedPosterData(slug);
  if (!data) throw new HttpError("not_found");
  const locale = posterLocale(request);
  const t = await getTranslations({ locale, namespace: "poster.wanted" });
  return renderPoster(
    WantedPoster({
      title: t("title"),
      subtitle: t("subtitle"),
      rewardLabel: t("reward"),
      reward: posterVnd(data.bounty, locale),
      player: data.player,
      crime: t("crime", { count: data.lossStreak }),
      footer: t("footer"),
    }),
  );
});
