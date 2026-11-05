import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { HeadToHead, StatPlayer } from "@/lib/stats";

import { BallClash } from "./ball-clash";

function Fighter({ player, className }: { player: StatPlayer; className: string }) {
  return (
    <Link href={`/players/${player.slug}`} className={cn("flex min-w-0 flex-1 flex-col items-center gap-2", className)}>
      <PlayerAvatar player={player} size="lg" />
      <span className="w-full truncate text-center font-bold">{player.name}</span>
    </Link>
  );
}

/** "ĐẠI CHIẾN": both fighters, the head-to-head score as LED digits, and a bar split in their ball colours. */
export function RivalryHero({ h }: { h: HeadToHead }) {
  const t = useTranslations("rivalry");
  const aLeads = h.aWins > h.bWins;
  const bLeads = h.bWins > h.aWins;

  return (
    <section aria-labelledby="rivalry-hero" className="felt rounded-lg border border-line p-5 shadow-card">
      <h2 id="rivalry-hero" className="text-center font-display text-3xl font-extrabold text-lamp">
        {t("hero")}
      </h2>
      <div className="mt-4 flex items-center gap-2">
        <Fighter player={h.a} className="fighter-a" />
        <div
          role="img"
          aria-label={t("heroAria", { a: h.a.name, b: h.b.name, aWins: h.aWins, bWins: h.bWins })}
          className="flex shrink-0 items-baseline gap-2 rounded-md bg-night/70 px-3 py-2 digits text-score font-bold"
        >
          <span className={cn(aLeads ? "text-lamp digits-glow" : "text-ivory")}>
            <RollingNumber value={String(h.aWins)} />
          </span>
          <span className="text-ivory-faint">:</span>
          <span className={cn(bLeads ? "text-lamp digits-glow" : "text-ivory")}>
            <RollingNumber value={String(h.bWins)} />
          </span>
        </div>
        <Fighter player={h.b} className="fighter-b" />
      </div>

      {h.played > 0 && <BallClash h={h} />}
      <p className="mt-2 text-center text-sm">{t("meetings", { count: h.played })}</p>
    </section>
  );
}
