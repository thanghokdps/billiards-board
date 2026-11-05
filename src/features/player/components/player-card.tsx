import { useTranslations } from "next-intl";

import { Ball } from "@/components/ui/ball";
import { HoloFrame } from "@/components/ui/holo-frame";
import { PlayerAvatar, type Streak } from "@/components/ui/player-avatar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { ELO_START, type StatPlayer } from "@/lib/stats";

import {
  CLOSE_MARGIN,
  OVERALL_BASE,
  OVERALL_ELO_PER_POINT,
  type CardAttribute,
  type CardStats,
} from "../lib/card-stats";

interface PlayerCardProps {
  player: StatPlayer;
  catchphrase: string | null;
  elo: number;
  rank: number;
  streak: Streak | null;
  stats: CardStats;
}

const ATTRIBUTES = ["accuracy", "nerve", "luck"] as const;

function Attribute({ label, attr }: { label: string; attr: CardAttribute }) {
  const t = useTranslations("player.card");
  return (
    <div className="min-w-0 text-center">
      <p className="digits text-score font-bold text-lamp digits-glow">
        {attr.value === null ? <span aria-label={t("noData")}>—</span> : <RollingNumber value={String(attr.value)} />}
      </p>
      <p className="truncate text-sm font-medium">{label}</p>
      <p className="text-2xs text-ivory-muted">{t("games", { count: attr.games })}</p>
    </div>
  );
}

/** FIFA-style card: felt-and-lamp frame, three attributes computed from real matches, formulas in the footnote. */
export function PlayerCard({ player, catchphrase, elo, rank, streak, stats }: PlayerCardProps) {
  const t = useTranslations("player.card");
  return (
    <HoloFrame>
      <article
        aria-label={player.name}
        className="rounded-xl bg-gradient-to-br from-lamp via-felt-bright to-lamp-soft p-0.5 shadow-lamp"
      >
        <div className="felt relative overflow-hidden rounded-xl">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-lamp/15 via-transparent to-night/70" />
          <div className="relative space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="digits text-hero font-bold text-lamp digits-glow">
                  <RollingNumber value={String(stats.overall)} label={t("overall", { value: stats.overall })} />
                </p>
                <p className="text-xs font-medium text-ivory-muted">{t("overallShort")}</p>
                <p className="mt-2 text-xs font-medium text-ivory-muted">{t("eloRank", { elo, rank })}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PlayerAvatar player={player} size="xl" streak={streak} />
                <span className="flex items-center gap-1.5 rounded-full bg-night/60 py-1 pr-3 pl-1.5 text-xs font-semibold">
                  <Ball color={player.ballColor} number={player.ballNumber} className="size-6" />
                  {t("ball", { number: player.ballNumber })}
                </span>
              </div>
            </div>

            <div className="space-y-1 border-y border-ivory-faint/30 py-3">
              <h1 className="font-display text-4xl font-extrabold leading-none">{player.name}</h1>
              {player.nickname && <p className="text-sm font-semibold text-lamp">{player.nickname}</p>}
              {catchphrase && <p className="text-sm italic text-ivory-muted">“{catchphrase}”</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ATTRIBUTES.map((name) => (
                <Attribute key={name} label={t(`attributes.${name}`)} attr={stats[name]} />
              ))}
            </div>

            <ul className="space-y-1 rounded-md bg-night/60 p-3 text-2xs leading-snug text-ivory-muted">
              {ATTRIBUTES.map((name) => (
                <li key={name}>
                  <strong className="font-semibold text-ivory">{t(`attributes.${name}`)}</strong>:{" "}
                  {t(`formula.${name}`, { close: Math.round(CLOSE_MARGIN * 100) })}
                </li>
              ))}
              <li>
                <strong className="font-semibold text-ivory">{t("overallShort")}</strong>:{" "}
                {t("formula.overall", { base: OVERALL_BASE, start: ELO_START, per: OVERALL_ELO_PER_POINT })}
              </li>
            </ul>
          </div>
        </div>
      </article>
    </HoloFrame>
  );
}
