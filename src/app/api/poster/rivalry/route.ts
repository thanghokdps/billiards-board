import { getTranslations } from "next-intl/server";

import { HttpError, route } from "@/server/http";
import { rivalryPosterData } from "@/server/posters/data";
import { posterLocale, renderPoster } from "@/server/posters/render";
import { RivalryPoster } from "@/server/posters/templates";

export const GET = route(async (request: Request) => {
  const data = await rivalryPosterData();
  if (!data) throw new HttpError("not_found");
  const locale = posterLocale(request);
  const t = await getTranslations({ locale, namespace: "poster" });
  return renderPoster(
    RivalryPoster({
      brand: t("brand"),
      title: t("rivalry.title"),
      a: data.a,
      b: data.b,
      aWins: data.aWins,
      bWins: data.bWins,
      meetings: t("rivalry.meetings", { count: data.played }),
    }),
  );
});
