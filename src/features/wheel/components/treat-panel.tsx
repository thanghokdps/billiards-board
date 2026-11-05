"use client";

import { Crosshair, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPercent } from "@/lib/domain";
import { treatedChances, withPin, type TreatPins } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

const MULTIPLIERS = [5, 10] as const;

interface TreatRowProps {
  player: PlayerRef;
  chance: number | undefined;
  pinned: boolean;
  victim: boolean;
  locked: boolean;
  onShare: (share: number) => void;
  onRelease: () => void;
  onVictim: () => void;
}

function TreatRow({ player, chance, pinned, victim, locked, onShare, onRelease, onVictim }: TreatRowProps) {
  const t = useTranslations("wheel");
  const locale = useLocale();
  const percent = Math.round((chance ?? 0) * 100);
  return (
    <li className="flex items-center gap-2">
      <PlayerAvatar player={player} size="xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-bold">{player.name}</span>
          <span className="digits text-lg font-bold text-lamp">
            {chance === undefined ? t("picked") : formatPercent(chance, locale)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          disabled={locked || chance === undefined}
          aria-label={t("treatShare", { name: player.name })}
          onChange={(e) => onShare(e.target.valueAsNumber / 100)}
          className="treat-slider"
          style={{ ["--ball" as string]: player.ballColor, ["--fill" as string]: `${percent}%` }}
        />
      </div>
      {pinned ? (
        <Button
          variant="subtle"
          size="icon-sm"
          disabled={locked}
          aria-label={t("treatRelease", { name: player.name })}
          onClick={onRelease}
        >
          <X className="size-4" aria-hidden />
        </Button>
      ) : (
        <span className="w-9 text-center text-2xs text-ivory-faint">{t("treatAuto")}</span>
      )}
      <Button
        variant={victim ? "danger" : "ghost"}
        size="icon-sm"
        aria-pressed={victim}
        aria-label={t(victim ? "unmakeVictim" : "makeVictim", { name: player.name })}
        disabled={locked}
        onClick={onVictim}
      >
        <Crosshair className="size-4" aria-hidden />
      </Button>
    </li>
  );
}

interface TreatPanelProps {
  /** Everyone on the wheel, picked players included. */
  players: PlayerRef[];
  picks: number[];
  weights: Record<number, number>;
  pins: TreatPins;
  victimId: number | null;
  multiplier: number | null;
  locked: boolean;
  onPinsChange: (pins: TreatPins) => void;
  onVictimChange: (id: number | null) => void;
  onMultiplierChange: (n: number) => void;
  onReset: () => void;
}

/** Admin only, and closed by default: the real odds must not show on a screen others are watching. */
export function TreatPanel({
  players,
  picks,
  weights,
  pins,
  victimId,
  multiplier,
  locked,
  onPinsChange,
  onVictimChange,
  onMultiplierChange,
  onReset,
}: TreatPanelProps) {
  const t = useTranslations("wheel");
  const [open, setOpen] = useState(false);
  const inDraw = players.filter((p) => !picks.includes(p.id));
  const pool = inDraw.map((p) => p.id);
  const chances = treatedChances(
    inDraw.map((p) => ({ id: p.id, label: p.name, color: p.ballColor, weight: weights[p.id] ?? 1 })),
    pins,
  );
  const active = Object.keys(pins).length > 0 || multiplier !== null || victimId !== null;

  function release(id: number) {
    onPinsChange(Object.fromEntries(Object.entries(pins).filter(([key]) => Number(key) !== id)));
  }

  return (
    <section className="rounded-lg border border-line bg-surface-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ivory-muted"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {t("treatTitle")}
        {active && <span aria-hidden className="size-1.5 rounded-full bg-lamp" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3">
              <div aria-label={t("treatBar")} role="img" className="flex h-2.5 overflow-hidden rounded-full bg-surface">
                {inDraw.map((p) => (
                  <span
                    key={p.id}
                    className="h-full transition-all duration-300"
                    style={{ width: `${(chances.get(p.id) ?? 0) * 100}%`, backgroundColor: p.ballColor }}
                  />
                ))}
              </div>
              <ul className="space-y-2.5">
                {players.map((player) => (
                  <TreatRow
                    key={player.id}
                    player={player}
                    chance={chances.get(player.id)}
                    pinned={pins[player.id] !== undefined}
                    victim={victimId === player.id}
                    locked={locked}
                    onShare={(share) => onPinsChange(withPin(pins, player.id, share, pool))}
                    onRelease={() => release(player.id)}
                    onVictim={() => onVictimChange(victimId === player.id ? null : player.id)}
                  />
                ))}
              </ul>
              <div role="group" aria-label={t("shortcuts")} className="flex flex-wrap items-center gap-2">
                {MULTIPLIERS.map((n) => (
                  <Chip
                    key={n}
                    selected={multiplier === n}
                    disabled={locked}
                    aria-label={t("repeatMultiplier", { n })}
                    onClick={() => onMultiplierChange(n)}
                  >
                    <span className="digits text-base font-bold">{t("multiplier", { n })}</span>
                  </Chip>
                ))}
                <Chip disabled={locked} aria-label={t("resetWeightsLabel")} onClick={onReset}>
                  {t("resetWeights")}
                </Chip>
              </div>
              <p className="text-xs text-ivory-muted">{t("treatHint")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
