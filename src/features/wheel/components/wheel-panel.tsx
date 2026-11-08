"use client";

import { RotateCcw, SkipForward, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PLAYERS_IN_FORMAT, type PairingFormat } from "@/lib/domain";
import { celebrate } from "@/lib/feedback";
import type { TreatPins, WheelEntry } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

import { SeatBoard } from "./seat-board";
import { SpinWheel, type SpinWheelHandle } from "./spin-wheel";
import { WinnerReveal } from "./winner-reveal";
import { useHydrated } from "../hooks/use-hydrated";

export interface WheelPairing {
  format: PairingFormat;
  sideA: PlayerRef[];
  sideB: PlayerRef[];
}

interface WheelPanelProps {
  players: PlayerRef[];
  /** Weight per player id: how many times a name repeats on the wheel. */
  weights: Record<number, number>;
  /** The admin's treat, applied to the draw only. */
  pins?: TreatPins;
  mode: PairingFormat;
  /** Rendered under a finished pairing (e.g. "Tạo trận từ cặp này"). */
  pairingActions?: (pairing: WheelPairing) => ReactNode;
  compact?: boolean;
  /** Picked player ids in order. Pass with `onPicksChange` when the parent also shows them; omitted = kept inside. */
  picks?: number[];
  onPicksChange?: (picks: number[]) => void;
  onSpinningChange?: (spinning: boolean) => void;
  /** Rendered above the wheel (e.g. the mode picker). */
  aboveWheel?: ReactNode;
  /** The player spinning: off the wheel and already seated on side A. */
  spinnerId?: number | null;
}

/**
 * One tap spins the next pick; each winner is removed for the next spin (requirement: "tự loại người đã trúng").
 * 1v1 = two spins, 2v2 = four spins alternating side A / side B, 1v1v1 = three spins, nobody on a side.
 * With a spinner, side A fills first (2v2: the first winner is their partner) and one seat fewer is spun for.
 */
export function WheelPanel({
  players,
  weights,
  pins,
  mode,
  pairingActions,
  compact,
  picks: controlledPicks,
  onPicksChange,
  onSpinningChange,
  aboveWheel,
  spinnerId = null,
}: WheelPanelProps) {
  const t = useTranslations("wheel");
  const [ownPicks, setOwnPicks] = useState<number[]>([]);
  const picks = controlledPicks ?? ownPicks;
  const setPicks = onPicksChange ?? setOwnPicks;
  const wheel = useRef<SpinWheelHandle>(null);
  const [spinning, setSpinningState] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const setSpinning = useCallback(
    (value: boolean) => {
      setSpinningState(value);
      onSpinningChange?.(value);
    },
    [onSpinningChange],
  );

  const needed = PLAYERS_IN_FORMAT[mode];
  const spins = spinnerId === null ? needed : needed - 1;
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const entries = useMemo<WheelEntry[]>(
    () =>
      players
        .filter((p) => !picks.includes(p.id) && p.id !== spinnerId)
        .map((p) => ({ id: p.id, label: p.name, color: p.ballColor, weight: weights[p.id] ?? 1, guest: p.guest }))
        .filter((e) => e.weight > 0),
    [players, picks, weights, spinnerId],
  );
  const done = picks.length >= spins;
  const hydrated = useHydrated();
  const canSpin = hydrated && !spinning && !done && entries.length > 0 && entries.length + picks.length >= spins;
  const short = entries.length + picks.length < spins;

  function onResult(entry: WheelEntry) {
    const rest = entries.filter((e) => e.id !== entry.id).map((e) => e.id);
    // Exactly the seats left: those players are the other team, so there is nothing to spin for.
    const seatedWithoutSpin = spinnerId !== null && rest.length === spins - picks.length - 1 ? rest : [];
    const next = [...picks, entry.id, ...seatedWithoutSpin];
    setRevealed(null);
    setPicks(next);
    if (!compact && next.length >= spins) {
      void celebrate(next.flatMap((id) => byId.get(id)?.ballColor ?? []));
    }
  }

  const seated = spinnerId === null ? picks : [spinnerId, ...picks];
  const toPlayers = (ids: number[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const threeWay = mode === "1v1v1";
  const seatsOnA = threeWay ? 2 : needed / 2;
  const pairing: WheelPairing =
    spinnerId === null && !threeWay
      ? {
          format: mode,
          sideA: toPlayers(seated.filter((_, i) => i % 2 === 0)),
          sideB: toPlayers(seated.filter((_, i) => i % 2 === 1)),
        }
      : { format: mode, sideA: toPlayers(seated.slice(0, seatsOnA)), sideB: toPlayers(seated.slice(seatsOnA)) };
  const sides = threeWay ? toPlayers(seated).map((p) => [p]) : [pairing.sideA, pairing.sideB];
  const allSides = threeWay ? Array.from({ length: needed }, (_, i) => sides[i] ?? []) : sides;

  return (
    <div className="space-y-4">
      {aboveWheel}

      <div data-spinning={spinning} className={cn(!compact && "wheel-stage relative overflow-hidden rounded-xl")}>
        {!compact && <div aria-hidden className="wheel-rays" />}
        <SpinWheel
          ref={wheel}
          entries={entries}
          pins={pins}
          onResult={onResult}
          onReveal={(entry) => setRevealed(entry.id)}
          onSpinningChange={setSpinning}
          compact={compact}
          className={compact ? "max-w-64" : undefined}
        />
        {!compact && <WinnerReveal player={revealed === null ? null : (byId.get(revealed) ?? null)} />}
      </div>

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
          <Button
            size="lg"
            onClick={() => wheel.current?.spin()}
            disabled={!canSpin}
            className={cn("min-w-48 text-lg", canSpin && !compact && "animate-pulse-ring")}
          >
            <Sparkles className="size-4" aria-hidden />
            {picks.length === 0 ? t("spin") : t("spinNext", { n: picks.length + 1, total: spins })}
          </Button>
        )}
      </div>

      {hydrated && short && <p className="text-center text-sm text-loss">{t("notEnough", { n: needed })}</p>}

      <SeatBoard sides={allSides} seatsPerSide={threeWay ? 1 : needed / 2} done={done} />

      {done && pairingActions && <div className="flex flex-wrap justify-center gap-2">{pairingActions(pairing)}</div>}
    </div>
  );
}
