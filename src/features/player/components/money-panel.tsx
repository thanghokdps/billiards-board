import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/misc";
import { SectionTitle } from "@/features/leaderboard";
import { Link } from "@/i18n/navigation";
import { formatPercent, formatVnd } from "@/lib/domain";
import type { PlayerStats } from "@/lib/stats";

interface MoneyPanelProps {
  stats: PlayerStats;
  /** This player's part of everything the club paid, 0–1, or null while nobody has paid. */
  clubShare: number | null;
  /** Set when the player is on a "wanted" run (5+ losses in a row): link to the poster. */
  wantedHref: string | null;
}

/** What the player paid out of their own pocket, and who collected the most from them. */
export function MoneyPanel({ stats, clubShare, wantedHref }: MoneyPanelProps) {
  const t = useTranslations("player.money");
  const locale = useLocale();
  const collector = stats.topCollector;
  return (
    <section aria-labelledby="money-title">
      <Card>
        <CardHeader>
          <SectionTitle id="money-title">{t("title")}</SectionTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {stats.paid === 0 ? (
            <p className="text-sm text-ivory-muted">{t("none")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Stat label={t("paid")} value={formatVnd(stats.paid, locale)} accent />
              {clubShare !== null && (
                <Stat label={t("share")} value={formatPercent(clubShare, locale)} hint={t("shareHint")} />
              )}
            </div>
          )}
          {collector && (
            <p className="text-sm text-ivory-muted">
              {t.rich("collector", {
                name: collector.player.name,
                amount: formatVnd(collector.amount, locale),
                who: (chunks) => (
                  <Link href={`/players/${collector.player.slug}`} className="font-bold text-ivory hover:text-lamp">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          )}
          {wantedHref && (
            <Button asChild variant="danger" size="sm">
              <a href={wantedHref} target="_blank" rel="noopener noreferrer">
                <Download aria-hidden className="size-4" />
                {t("wanted")}
              </a>
            </Button>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
