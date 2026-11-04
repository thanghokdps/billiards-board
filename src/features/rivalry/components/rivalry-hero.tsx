import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { HeadToHead, StatPlayer } from "@/lib/stats";

function Fighter({ player }: { player: StatPlayer }) {
  return (
    <Link href={`/players/${player.slug}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
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
        <Fighter player={h.a} />
        <div
          role="img"
          aria-label={t("heroAria", { a: h.a.name, b: h.b.name, aWins: h.aWins, bWins: h.bWins })}
          className="flex shrink-0 items-baseline gap-2 rounded-md bg-night/70 px-3 py-2 digits text-score font-bold"
        >
          <span className={cn(aLeads ? "text-lamp digits-glow" : "text-ivory")}>{h.aWins}</span>
          <span className="text-ivory-faint">:</span>
          <span className={cn(bLeads ? "text-lamp digits-glow" : "text-ivory")}>{h.bWins}</span>
        </div>
        <Fighter player={h.b} />
      </div>

      {h.played > 0 && (
        <div aria-hidden className="mt-5 flex h-3 overflow-hidden rounded-full bg-night/70">
          <div style={{ width: `${(h.aWins / h.played) * 100}%`, backgroundColor: h.a.ballColor }} />
          <div style={{ width: `${(h.bWins / h.played) * 100}%`, backgroundColor: h.b.ballColor }} />
        </div>
      )}
      <p className="mt-2 text-center text-sm">{t("meetings", { count: h.played })}</p>
    </section>
  );
}
