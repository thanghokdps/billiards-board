"use client";

import { Crosshair, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPercent } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

export const MAX_WEIGHT = 20;

interface ChanceListProps {
  players: PlayerRef[];
  weights: Record<number, number>;
  /** Chance per player id among those still in the draw. */
  chances: Map<number, number>;
  picked: number[];
  victimId: number | null;
  advanced: boolean;
  locked: boolean;
  onWeightChange: (playerId: number, weight: number) => void;
  onVictimChange: (playerId: number | null) => void;
}

/** Everyone's live chance (always shown), the ×N badge for weighted people, and the +/- and victim controls. */
export function ChanceList({
  players,
  weights,
  chances,
  picked,
  victimId,
  advanced,
  locked,
  onWeightChange,
  onVictimChange,
}: ChanceListProps) {
  const t = useTranslations("wheel");
  const locale = useLocale();
  const weightOf = (id: number) => weights[id] ?? 1;
  const inDraw = players.filter((p) => !picked.includes(p.id) && weightOf(p.id) > 0);
  const uniform = new Set(inDraw.map((p) => weightOf(p.id))).size <= 1;

  return (
    <ul className="divide-y divide-line">
      {players.map((player) => {
        const weight = weightOf(player.id);
        const isPicked = picked.includes(player.id);
        const isVictim = victimId === player.id;
        const chance = chances.get(player.id);
        return (
          <li key={player.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
            <PlayerAvatar player={player} size="sm" className={isPicked || weight === 0 ? "opacity-50" : undefined} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-bold">{player.name}</span>
              {isVictim && (
                <Badge tone="loss">
                  <Crosshair className="size-3" aria-hidden />
                  {t("victimBadge")}
                </Badge>
              )}
              {!uniform && weight > 1 && !isPicked && <Badge tone="lamp">{t("multiplier", { n: weight })}</Badge>}
              {weight === 0 && <Badge>{t("hidden")}</Badge>}
            </div>
            <span className="digits w-14 text-right text-xl font-bold text-lamp">
              {isPicked ? (
                <Badge tone="win">{t("picked")}</Badge>
              ) : chance !== undefined ? (
                formatPercent(chance, locale)
              ) : (
                "–"
              )}
            </span>
            <Button
              variant={isVictim ? "danger" : "ghost"}
              size="icon-sm"
              aria-pressed={isVictim}
              aria-label={isVictim ? t("unmakeVictim", { name: player.name }) : t("makeVictim", { name: player.name })}
              disabled={locked || isPicked}
              onClick={() => onVictimChange(isVictim ? null : player.id)}
            >
              <Crosshair className="size-4" aria-hidden />
            </Button>
            {advanced && (
              <div className="flex basis-full items-center justify-end gap-2">
                <Button
                  variant="subtle"
                  size="icon-sm"
                  aria-label={t("weightDown", { name: player.name })}
                  disabled={locked || weight <= 0}
                  onClick={() => onWeightChange(player.id, weight - 1)}
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <output
                  aria-label={t("weightValue", { name: player.name })}
                  className="digits w-8 text-center text-lg font-bold"
                >
                  {weight}
                </output>
                <Button
                  variant="subtle"
                  size="icon-sm"
                  aria-label={t("weightUp", { name: player.name })}
                  disabled={locked || weight >= MAX_WEIGHT}
                  onClick={() => onWeightChange(player.id, weight + 1)}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
