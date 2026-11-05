import { Landmark } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/domain";
import type { MoneyBreakdown } from "@/lib/stats";

/** Who paid how much; the top payer is the "Cây ATM". Bars use each player's ball colour. */
export function Contributors({ byPlayer }: { byPlayer: MoneyBreakdown["byPlayer"] }) {
  const t = useTranslations("money");
  const locale = useLocale();
  const max = byPlayer[0]?.paid ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("contributors")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-ivory-muted">{t("contributorsHint")}</p>
        <ol className="space-y-2">
          {byPlayer.map(({ player, paid }, index) => {
            const isAtm = index === 0 && paid > 0;
            return (
              <li
                key={player.id}
                className={cn(
                  "rounded-md border px-3 py-2.5",
                  isAtm ? "border-lamp/40 bg-lamp/10 shadow-lamp" : "border-transparent",
                )}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={player} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/players/${player.slug}`} className="truncate font-bold hover:text-lamp">
                        {player.name}
                      </Link>
                      {isAtm && (
                        <Badge tone="lamp">
                          <Landmark className="size-3" aria-hidden />
                          {t("atm")}
                        </Badge>
                      )}
                    </div>
                    {isAtm && <p className="text-xs text-ivory-muted">{t("atmLine")}</p>}
                  </div>
                  <p
                    className={cn("digits shrink-0 text-xl font-bold", isAtm ? "text-lamp digits-glow" : "text-ivory")}
                  >
                    {formatVnd(paid, locale)}
                  </p>
                </div>
                <div aria-hidden className="mt-2 h-2 overflow-clip rounded-full bg-surface-3">
                  <div
                    className="bar-fill h-full rounded-full"
                    style={{ width: max > 0 ? `${(paid / max) * 100}%` : "0%", backgroundColor: player.ballColor }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
