import { Clock, Crosshair, Crown, Flame, Landmark, Lock, Zap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/features/leaderboard";
import { cn } from "@/lib/cn";
import type { AchievementId } from "@/lib/stats";

const BADGES: { id: AchievementId; icon: LucideIcon }[] = [
  { id: "sniper_3c", icon: Crosshair },
  { id: "atm", icon: Landmark },
  { id: "phoenix", icon: Flame },
  { id: "clock", icon: Clock },
  { id: "unstoppable", icon: Zap },
  { id: "upset_king", icon: Crown },
];

/** All six achievements; the ones not earned yet are greyed out with a lock. */
export function BadgesPanel({ earned }: { earned: AchievementId[] }) {
  const t = useTranslations("player.badges");
  return (
    <section aria-labelledby="badges-title">
      <Card>
        <CardHeader>
          <SectionTitle id="badges-title">{t("title")}</SectionTitle>
          <span className="digits text-sm text-ivory-muted">
            {earned.length}/{BADGES.length}
          </span>
        </CardHeader>
        <CardBody>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BADGES.map(({ id, icon: Icon }) => {
              const unlocked = earned.includes(id);
              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3",
                    unlocked ? "border-lamp/40 bg-lamp/10" : "border-line bg-surface-2/50 opacity-50 grayscale",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      unlocked ? "bg-lamp text-night shadow-lamp" : "bg-surface-3 text-ivory-muted",
                    )}
                  >
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-bold">
                      {t(`items.${id}.name`)}
                      {!unlocked && <Lock aria-hidden className="size-3.5" />}
                    </p>
                    <p className="text-xs text-ivory-muted">{t(`items.${id}.description`)}</p>
                    <p className="sr-only">{unlocked ? t("unlocked") : t("locked")}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
}
