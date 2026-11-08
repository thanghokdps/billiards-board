"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { PlayerRef } from "@/server/matches/schema";

import { useHoldRepeat } from "../hooks/use-hold-repeat";

interface ScoreDialProps {
  players: PlayerRef[];
  value: number | null;
  disabled: boolean;
  /** Changes the score by one step; a held button calls it again and again. */
  onStep: (delta: 1 | -1) => void;
}

function StepButton({
  delta,
  label,
  disabled,
  onStep,
}: {
  delta: 1 | -1;
  label: string;
  disabled: boolean;
  onStep: (d: 1 | -1) => void;
}) {
  const hold = useHoldRepeat(() => onStep(delta));
  const Icon = delta > 0 ? Plus : Minus;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...hold}
      className="flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-lamp/40 bg-night/50 text-lamp transition-colors select-none hover:bg-lamp/15 active:scale-95 disabled:opacity-40"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/** A brass plate with rolling digits for one score; "—" until someone writes one, since the score is optional. */
export function ScoreDial({ players, value, disabled, onStep }: ScoreDialProps) {
  const t = useTranslations("submit.score");
  const names = players.map((p) => p.name).join(" & ");
  return (
    <div role="group" aria-label={t("of", { names })} className="flex min-w-0 flex-col items-center gap-2">
      <span className="flex max-w-full items-center gap-1.5">
        <span className="flex shrink-0 -space-x-2">
          {players.map((p) => (
            <PlayerAvatar key={p.id} player={p} size="xs" />
          ))}
        </span>
        <span className="truncate text-sm font-semibold">{names}</span>
      </span>
      <p
        aria-live="polite"
        className="digits plaque-digits digits-glow flex h-14 w-full min-w-0 items-center justify-center rounded-md border border-lamp/30 bg-night/60 text-score font-bold text-lamp"
      >
        {value === null ? <span aria-label={t("empty")}>—</span> : <RollingNumber key={value} value={String(value)} />}
      </p>
      <div className="flex items-center gap-3">
        <StepButton delta={-1} label={t("minus", { names })} disabled={disabled || value === null} onStep={onStep} />
        <StepButton delta={1} label={t("plus", { names })} disabled={disabled} onStep={onStep} />
      </div>
    </div>
  );
}
