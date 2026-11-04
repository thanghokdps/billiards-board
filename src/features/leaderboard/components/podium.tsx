import { Crown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/domain";
import type { PlayerStats } from "@/lib/stats";

import { SectionTitle } from "./section-title";
import { MIN_RANKED_GAMES } from "../lib/ranking";

const SLOTS = [
  { rank: 1, plinth: "h-20", avatar: "xl", order: "order-2" },
  { rank: 2, plinth: "h-14", avatar: "lg", order: "order-1" },
  { rank: 3, plinth: "h-10", avatar: "lg", order: "order-3" },
] as const;

/** Top three as a podium (#2 · #1 · #3 on screen, rank order in the DOM), LED win rate, lamp glow on the winner. */
export function Podium({ top }: { top: PlayerStats[] }) {
  const t = useTranslations("leaderboard.podium");
  const locale = useLocale();
  return (
    <section aria-labelledby="podium-title">
      <SectionTitle id="podium-title" className="mb-3">
        {t("title")}
      </SectionTitle>
      <ol className="grid grid-cols-[1fr_1.25fr_1fr] items-end gap-2">
        {SLOTS.map(({ rank, plinth, avatar, order }) => {
          const s = top[rank - 1];
          if (!s) return <li key={rank} aria-hidden className={order} />;
          const first = rank === 1;
          return (
            <li key={rank} className={cn("flex min-w-0 flex-col items-center", order)}>
              <Link
                href={`/players/${s.player.slug}`}
                className="group flex min-w-0 flex-col items-center gap-1 rounded-md px-1 pb-2 text-center"
              >
                {first && <Crown aria-hidden className="size-6 animate-flicker text-lamp" />}
                <PlayerAvatar
                  player={s.player}
                  size={avatar}
                  streak={s.current}
                  className={first ? "drop-shadow-lg" : undefined}
                />
                <span className="w-full truncate font-bold group-hover:text-lamp">{s.player.name}</span>
                <span className={cn("digits text-score font-bold", first ? "text-lamp digits-glow" : "text-ivory")}>
                  {formatPercent(s.winRate, locale)}
                </span>
                <span className="text-2xs text-ivory-muted">{t("record", { wins: s.wins, losses: s.losses })}</span>
                {s.played < MIN_RANKED_GAMES && (
                  <span className="text-2xs text-ivory-faint">{t("provisional", { min: MIN_RANKED_GAMES })}</span>
                )}
              </Link>
              <div
                className={cn(
                  "flex w-full items-start justify-center rounded-t-md border border-b-0 pt-2 digits text-2xl font-bold",
                  plinth,
                  first
                    ? "border-lamp/50 bg-lamp/15 text-lamp shadow-lamp"
                    : "border-line-strong bg-surface-2 text-ivory-muted",
                )}
              >
                <span className="sr-only">{t("rank", { rank })}</span>
                <span aria-hidden>{rank}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-2xs text-ivory-faint">{t("rule", { min: MIN_RANKED_GAMES })}</p>
    </section>
  );
}
