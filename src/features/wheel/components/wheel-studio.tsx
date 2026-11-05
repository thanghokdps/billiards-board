"use client";

import { MotionConfig } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useChat } from "@/features/shell";
import { matchTitle, type PairingFormat } from "@/lib/domain";
import { applyVictim, type WheelEntry } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

import { ModePicker } from "./mode-picker";
import { RosterGrid } from "./roster-grid";
import { TreatPanel } from "./treat-panel";
import { WheelPanel } from "./wheel-panel";
import { useHydrated } from "../hooks/use-hydrated";
import { useTreatPins } from "../hooks/use-treat-pins";

const MODE_HINTS = { "1v1": "modeHint1v1", "2v2": "modeHint2v2", "1v1v1": "modeHint1v1v1" } as const;
const MODE_SPINNER_HINTS = {
  "1v1": "modeHintSpinner1v1",
  "2v2": "modeHintSpinner2v2",
  "1v1v1": "modeHintSpinner1v1v1",
} as const;

interface WheelStudioProps {
  /** Every active player. */
  players: PlayerRef[];
  /** Only the admin can weigh the wheel or create a match from a pairing. */
  admin: boolean;
}

const toEntry = (player: PlayerRef, weights: Record<number, number>): WheelEntry => ({
  id: player.id,
  label: player.name,
  color: player.ballColor,
  weight: weights[player.id] ?? 1,
});

/** The Random Wheel screen: the show on the left (desktop), who plays on the right; stacked on phones. Nothing is saved. */
export function WheelStudio({ players, admin }: WheelStudioProps) {
  const t = useTranslations("wheel");
  const chat = useChat();
  const [included, setIncluded] = useState<number[]>(() => players.map((p) => p.id));
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<PairingFormat>("2v2");
  const [spinnerId, setSpinnerId] = useState<number | null>(null);
  const [victimId, setVictimId] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [isSpinning, setSpinning] = useState(false);
  const [pins, setPins] = useTreatPins(admin);
  const hydrated = useHydrated();
  const spinning = isSpinning || !hydrated;

  if (players.length === 0) return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;

  const participants = players.filter((p) => included.includes(p.id));
  const spinner = participants.find((p) => p.id === spinnerId) ?? null;
  const onWheel = participants.filter((p) => p.id !== spinner?.id);

  /** ×N for everyone, resting players included so they rejoin at ×N; the victim stays at 1. */
  function reweigh(nextVictim: number | null, nextMultiplier: number) {
    const weighted = applyVictim(
      players.map((p) => toEntry(p, weights)),
      nextVictim,
      nextMultiplier,
    );
    setWeights(Object.fromEntries(weighted.map((e) => [e.id, e.weight])));
  }

  function toggleParticipant(id: number) {
    setIncluded((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    if (victimId === id) setVictimId(null);
    if (spinnerId === id) setSpinnerId(null);
    setPicks([]);
  }

  function changeSpinner(id: number | null) {
    setSpinnerId(id);
    setPicks([]);
    if (id !== null && id === victimId) changeVictim(null);
  }

  function changeVictim(id: number | null) {
    setVictimId(id);
    if (id === null) {
      setMultiplier(null);
      setWeights({});
      return;
    }
    if (id === spinnerId) changeSpinner(null);
    if (!included.includes(id)) setIncluded((ids) => [...ids, id]);
    if (multiplier !== null) reweigh(id, multiplier);
  }

  function chooseMultiplier(n: number) {
    setMultiplier(n);
    reweigh(victimId, n);
  }

  function resetTreat() {
    setMultiplier(null);
    setVictimId(null);
    setWeights({});
    setPins({});
  }

  function changeMode(next: PairingFormat) {
    setMode(next);
    setPicks([]);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="min-w-0">
          <WheelPanel
            players={participants}
            weights={weights}
            pins={admin ? pins : undefined}
            mode={mode}
            spinnerId={spinner?.id ?? null}
            picks={picks}
            onPicksChange={setPicks}
            onSpinningChange={setSpinning}
            aboveWheel={
              <ModePicker
                mode={mode}
                disabled={spinning}
                hint={spinner ? t(MODE_SPINNER_HINTS[mode], { name: spinner.name }) : t(MODE_HINTS[mode])}
                onChange={changeMode}
              />
            }
            pairingActions={
              admin
                ? (pairing) => (
                    <Button
                      variant="felt"
                      onClick={() => chat.open(t("createMatchPrompt", { match: matchTitle(pairing) }), "prefill")}
                    >
                      {t("createMatch")}
                    </Button>
                  )
                : undefined
            }
          />
        </div>

        <div
          aria-label={t("controlsSection")}
          role="group"
          className="min-w-0 space-y-4 transition-opacity duration-500 data-[spinning=true]:opacity-40"
          data-spinning={isSpinning}
        >
          <RosterGrid
            players={players}
            included={included}
            spinnerId={spinner?.id ?? null}
            picks={picks}
            disabled={spinning}
            onToggle={toggleParticipant}
            onSpinner={changeSpinner}
          />
          {admin && (
            <TreatPanel
              players={onWheel}
              picks={picks}
              weights={weights}
              pins={pins}
              victimId={victimId}
              multiplier={multiplier}
              locked={spinning}
              onPinsChange={setPins}
              onVictimChange={changeVictim}
              onMultiplierChange={chooseMultiplier}
              onReset={resetTreat}
            />
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
