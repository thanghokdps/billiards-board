import { Bird, Clock, Crosshair, Crown, Landmark, Zap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import type { AchievementId, StatPlayer } from "@/lib/stats";

const BADGES: { id: AchievementId; icon: LucideIcon }[] = [
  { id: "sniper_3c", icon: Crosshair },
  { id: "atm", icon: Landmark },
  { id: "phoenix", icon: Bird },
  { id: "clock", icon: Clock },
  { id: "unstoppable", icon: Zap },
  { id: "upset_king", icon: Crown },
];

interface AchievementsProps {
  players: StatPlayer[];
  achievements: Record<number, AchievementId[]>;
}

/** Every badge with the players who hold it right now. */
export function Achievements({ players, achievements }: AchievementsProps) {
  const t = useTranslations("fame");
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {BADGES.map(({ id, icon: Icon }) => {
        const holders = players.filter((p) => achievements[p.id]?.includes(id));
        return (
          <li key={id}>
            <Card className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-felt/30 text-win">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-wide">
                    {t(`badge.${id}.name`)}
                  </h3>
                  <p className="text-xs text-ivory-muted">{t(`badge.${id}.hint`)}</p>
                </div>
              </div>
              {holders.length === 0 ? (
                <p className="text-sm text-ivory-faint">{t("nobody")}</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {holders.map((player) => (
                    <li key={player.id}>
                      <Link
                        href={`/players/${player.slug}`}
                        className="flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 text-sm font-semibold hover:bg-surface-3"
                      >
                        <PlayerAvatar player={player} size="xs" />
                        {player.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
