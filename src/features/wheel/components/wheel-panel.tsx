"use client";

import { RotateCcw, SkipForward, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPercent } from "@/lib/domain";
import type { WheelEntry } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

import { SpinWheel, type SpinWheelHandle } from "./spin-wheel";

export interface WheelPairing {
  sideA: PlayerRef[];
  sideB: PlayerRef[];
}

interface WheelPanelProps {
  players: PlayerRef[];
  /** Weight per player id; 0 hides a player. */
  weights: Record<number, number>;
  mode: "1v1" | "2v2";
  /** Rendered under a finished pairing (e.g. "Tạo trận từ cặp này"). */
  pairingActions?: (pairing: WheelPairing) => ReactNode;
  compact?: boolean;
  /** Picked player ids in order. Pass with `onPicksChange` when the parent also shows them; omitted = kept inside. */
  picks?: number[];
  onPicksChange?: (picks: number[]) => void;
  onSpinningChange?: (spinning: boolean) => void;
  /** Rendered directly under the wheel, above the spin button (e.g. the ×N shortcut chips). */
  belowWheel?: ReactNode;
}

/**
 * One tap spins the next pick; each winner is removed for the next spin (requirement: "tự loại người đã trúng").
 * 1v1 = two spins, 2v2 = four spins alternating side A / side B.
 */
export function WheelPanel({
  players,
  weights,
  mode,
  pairingActions,
  compact,
  picks: controlledPicks,
  onPicksChange,
  onSpinningChange,
  belowWheel,
}: WheelPanelProps) {
  const t = useTranslations("wheel");
  const locale = useLocale();
  const [ownPicks, setOwnPicks] = useState<number[]>([]);
  const picks = controlledPicks ?? ownPicks;
  const setPicks = onPicksChange ?? setOwnPicks;
  const wheel = useRef<SpinWheelHandle>(null);
  const [spinning, setSpinningState] = useState(false);
  const setSpinning = useCallback(
    (value: boolean) => {
      setSpinningState(value);
      onSpinningChange?.(value);
    },
    [onSpinningChange],
  );

  const needed = mode === "1v1" ? 2 : 4;
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const entries = useMemo<WheelEntry[]>(
    () =>
      players
        .filter((p) => !picks.includes(p.id))
        .map((p) => ({ id: p.id, label: p.name, color: p.ballColor, weight: weights[p.id] ?? 1 }))
        .filter((e) => e.weight > 0),
    [players, picks, weights],
  );
  const done = picks.length >= needed;
  const canSpin = !spinning && !done && entries.length > 0 && entries.length + picks.length >= needed;

  const onResult = useCallback((entry: WheelEntry) => setPicks([...picks, entry.id]), [picks, setPicks]);
  const pairing: WheelPairing = {
    sideA: picks.filter((_, i) => i % 2 === 0).map((id) => byId.get(id)!),
    sideB: picks.filter((_, i) => i % 2 === 1).map((id) => byId.get(id)!),
  };

  return (
    <div className="space-y-4">
      <SpinWheel
        ref={wheel}
        entries={entries}
        onResult={onResult}
        onSpinningChange={setSpinning}
        percentLabel={(share) => formatPercent(share, locale)}
        className={compact ? "max-w-64" : undefined}
      />

      {belowWheel}

      <div className="flex items-center justify-center gap-2">
        {spinning ? (
          <Button variant="outline" onClick={() => wheel.current?.skip()}>
            <SkipForward className="size-4" aria-hidden />
            {t("skip")}
          </Button>
        ) : done ? (
          <Button variant="outline" onClick={() => setPicks([])}>
            <RotateCcw className="size-4" aria-hidden />
            {t("again")}
          </Button>
        ) : (
          <Button size="lg" onClick={() => wheel.current?.spin()} disabled={!canSpin} className="min-w-40">
            <Sparkles className="size-4" aria-hidden />
            {picks.length === 0 ? t("spin") : t("spinNext", { n: picks.length + 1, total: needed })}
          </Button>
        )}
      </div>

      {(picks.length > 0 || !canSpin) && (
        <div aria-live="polite" className="rounded-lg border border-line bg-surface-2 p-3">
          {entries.length + picks.length < needed && (
            <p className="text-center text-sm text-loss">{t("notEnough", { n: needed })}</p>
          )}
          {picks.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <Team players={pairing.sideA} />
              <span className="font-display text-xl font-bold text-lamp">VS</span>
              <Team players={pairing.sideB} align="right" />
            </div>
          )}
          {done && pairingActions && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">{pairingActions(pairing)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Team({ players, align }: { players: PlayerRef[]; align?: "right" }) {
  return (
    <div
      className={
        align === "right" ? "flex flex-1 flex-row-reverse flex-wrap gap-2 text-right" : "flex flex-1 flex-wrap gap-2"
      }
    >
      {players.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 font-bold">
          <PlayerAvatar player={p} size="sm" />
          {p.name}
        </span>
      ))}
    </div>
  );
}
