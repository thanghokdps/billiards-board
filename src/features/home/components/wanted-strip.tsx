import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatVnd } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

interface WantedEntry {
  player: StatPlayer;
  streak: number;
  bounty: number;
}

/** Players on 5+ straight losses, each with their WANTED poster. */
export function WantedStrip({ entries }: { entries: WantedEntry[] }) {
  const t = useTranslations("home.wanted");
  const locale = useLocale();
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {entries.map(({ player, streak, bounty }) => (
        <li key={player.id}>
          <Card className="flex overflow-hidden border-loss/40">
            <a
              href={`/api/poster/wanted/${player.slug}?locale=${locale}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t("posterOf", { name: player.name })}
              className="poster-swing relative aspect-4/5 w-24 shrink-0 bg-night"
            >
              <Image
                src={`/api/poster/wanted/${player.slug}?locale=${locale}`}
                alt=""
                fill
                sizes="96px"
                loading="eager"
                unoptimized
                className="object-cover"
              />
            </a>
            <div className="min-w-0 space-y-1 p-3">
              <p className="text-xs font-semibold text-loss">{t("badge")}</p>
              <Link
                href={`/players/${player.slug}`}
                className="block truncate font-display text-3xl font-bold leading-none hover:text-lamp"
              >
                {player.name}
              </Link>
              <p className="text-sm text-ivory-muted">{t("line", { count: streak })}</p>
              <p className="digits digits-glow text-xl font-bold text-lamp">
                {t("bounty", { amount: formatVnd(bounty, locale) })}
              </p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
