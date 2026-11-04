import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { formatVnd, GAME_TYPES } from "@/lib/domain";
import type { MoneyBreakdown } from "@/lib/stats";

/** Average bill per match for each table type, as horizontal bars scaled to the dearest type. */
export function GameTypeCosts({ byGameType }: { byGameType: MoneyBreakdown["byGameType"] }) {
  const t = useTranslations("money");
  const common = useTranslations("common");
  const locale = useLocale();
  const max = Math.max(...GAME_TYPES.map((g) => byGameType[g].avg));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("byType")}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="space-y-4">
          {GAME_TYPES.map((gameType) => {
            const { avg, count } = byGameType[gameType];
            return (
              <li key={gameType}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GameTypeBadge gameType={gameType} />
                    <span className="text-xs text-ivory-muted">{common("matches", { count })}</span>
                  </div>
                  <p className="digits text-xl font-bold">
                    {count > 0 ? (
                      formatVnd(avg, locale)
                    ) : (
                      <span className="text-sm text-ivory-faint">{t("byTypeEmpty")}</span>
                    )}
                  </p>
                </div>
                <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-felt-bright"
                    style={{ width: max > 0 ? `${(avg / max) * 100}%` : "0%" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
