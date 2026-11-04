import { getTranslations } from "next-intl/server";

import { formatDate, GAME_LABEL } from "@/lib/domain";
import { HttpError, route } from "@/server/http";
import { matchPosterData } from "@/server/posters/data";
import { posterLocale, posterVnd, renderPoster } from "@/server/posters/render";
import { MatchPoster } from "@/server/posters/templates";

export const GET = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError("not_found");
  const data = await matchPosterData(id);
  if (!data) throw new HttpError("not_found");
  const locale = posterLocale(request);
  const t = await getTranslations({ locale, namespace: "poster" });
  const { match } = data;
  return renderPoster(
    MatchPoster({
      brand: t("brand"),
      headline: t(`headline.${data.reason ?? "default"}`),
      gameLabel: GAME_LABEL[match.gameType],
      dateLabel: formatDate(match.date, locale, "long"),
      billLabel: match.bill ? t("bill", { amount: posterVnd(match.bill, locale) }) : null,
      sideA: data.sideA,
      sideB: data.sideB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      winnerSide: match.winnerSide,
      winLabel: t("win"),
    }),
  );
});
