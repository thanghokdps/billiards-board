"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/misc";
import { useChat } from "@/features/shell";
import { MATCH_FORMATS, matchTitle, type MatchFormat } from "@/lib/domain";
import { applyVictim, probabilities, type WheelEntry } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

import { ChanceList } from "./chance-list";
import { ParticipantChip } from "./participant-chip";
import { WheelPanel } from "./wheel-panel";
import { useHydrated } from "../hooks/use-hydrated";

const MULTIPLIERS = [5, 10] as const;
const MODE_LABELS = { "1v1": "mode1v1", "2v2": "mode2v2", "1v1v1": "mode1v1v1" } as const;
const MODE_HINTS = { "1v1": "modeHint1v1", "2v2": "modeHint2v2", "1v1v1": "modeHint1v1v1" } as const;
const MODE_SPINNER_HINTS = {
  "1v1": "modeHintSpinner1v1",
  "2v2": "modeHintSpinner2v2",
  "1v1v1": "modeHintSpinner1v1v1",
} as const;

interface WheelStudioProps {
  /** Every active player. */
  players: PlayerRef[];
  /** Only the admin sees "create a match from this pairing". */
  admin: boolean;
}

const toEntry = (player: PlayerRef, weights: Record<number, number>): WheelEntry => ({
  id: player.id,
  label: player.name,
  color: player.ballColor,
  weight: weights[player.id] ?? 1,
});

/** The Random Wheel screen: wheel on the left (desktop), setup on the right; stacked on phones. Results are never saved. */
export function WheelStudio({ players, admin }: WheelStudioProps) {
  const t = useTranslations("wheel");
  const chat = useChat();
  const hintId = useId();
  const [included, setIncluded] = useState<number[]>(() => players.map((p) => p.id));
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<MatchFormat>("2v2");
  const [spinnerId, setSpinnerId] = useState<number | null>(null);
  const [victimId, setVictimId] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [isSpinning, setSpinning] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const hydrated = useHydrated();
  const spinning = isSpinning || !hydrated;

  if (players.length === 0) return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;

  const participants = players.filter((p) => included.includes(p.id));
  const spinner = participants.find((p) => p.id === spinnerId) ?? null;
  const victim = participants.find((p) => p.id === victimId) ?? null;
  const onWheel = participants.filter((p) => p.id !== spinner?.id);
  const chances = probabilities(onWheel.filter((p) => !picks.includes(p.id)).map((p) => toEntry(p, weights)));

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

  function changeWeight(id: number, weight: number) {
    setMultiplier(null);
    setWeights((current) => ({ ...current, [id]: Math.max(0, weight) }));
  }

  function resetWeights() {
    setMultiplier(null);
    setVictimId(null);
    setWeights({});
  }

  function changeMode(next: MatchFormat) {
    setMode(next);
    setPicks([]);
  }

  const shortcuts = (
    <div className="space-y-2">
      <div role="group" aria-label={t("shortcuts")} className="flex flex-wrap items-center justify-center gap-2">
        {MULTIPLIERS.map((n) => (
          <Chip
            key={n}
            selected={multiplier === n}
            disabled={spinning}
            aria-label={t("repeatMultiplier", { n })}
            onClick={() => chooseMultiplier(n)}
          >
            <span className="digits text-base font-bold">{t("multiplier", { n })}</span>
          </Chip>
        ))}
        <Chip disabled={spinning} aria-label={t("resetWeightsLabel")} onClick={resetWeights}>
          {t("resetWeights")}
        </Chip>
      </div>
      <p role="status" className="flex items-center justify-center gap-2 text-center text-sm text-ivory-muted">
        {victim ? (
          <>
            <span className="font-semibold text-loss">{t("victimIs", { name: victim.name })}</span>
            <Button variant="ghost" size="sm" disabled={spinning} onClick={() => changeVictim(null)}>
              {t("victimClear")}
            </Button>
          </>
        ) : (
          t("victimNone")
        )}
      </p>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
      <div className="lg:col-span-3">
        <WheelPanel
          players={participants}
          weights={weights}
          mode={mode}
          spinnerId={spinner?.id ?? null}
          picks={picks}
          onPicksChange={setPicks}
          onSpinningChange={setSpinning}
          belowWheel={shortcuts}
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

      <Card
        aria-label={t("controlsSection")}
        role="group"
        className="divide-y divide-line lg:col-span-2 [&>section]:space-y-3 [&>section]:p-4"
      >
        <section>
          <CardTitle>{t("modeTitle")}</CardTitle>
          <div role="group" aria-label={t("modeTitle")} className="flex gap-2">
            {MATCH_FORMATS.map((m) => (
              <Chip
                key={m}
                selected={mode === m}
                disabled={spinning}
                className="h-11 flex-1 justify-center"
                onClick={() => changeMode(m)}
              >
                <span className="digits text-xl font-bold">{t(MODE_LABELS[m])}</span>
              </Chip>
            ))}
          </div>
          <p className="text-sm text-ivory-muted">
            {spinner ? t(MODE_SPINNER_HINTS[mode], { name: spinner.name }) : t(MODE_HINTS[mode])}
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("participantsTitle")}</CardTitle>
            <span className="digits text-base font-semibold text-ivory-muted">
              {t("participantsCount", { selected: participants.length, total: players.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <ParticipantChip
                key={player.id}
                player={player}
                included={included.includes(player.id)}
                victim={victimId === player.id}
                disabled={spinning}
                describedBy={hintId}
                onToggle={() => toggleParticipant(player.id)}
                onMakeVictim={() => changeVictim(player.id)}
              />
            ))}
          </div>
          <p id={hintId} className="text-sm text-ivory-muted">
            {t("participantsHint")}
          </p>
        </section>

        <section>
          <CardTitle>{t("spinnerTitle")}</CardTitle>
          <div role="group" aria-label={t("spinnerTitle")} className="flex flex-wrap gap-2">
            {participants.map((player) => {
              const isSpinner = spinner?.id === player.id;
              return (
                <Chip
                  key={player.id}
                  selected={isSpinner}
                  disabled={spinning}
                  onClick={() => changeSpinner(isSpinner ? null : player.id)}
                >
                  {player.name}
                </Chip>
              );
            })}
          </div>
          <p className="text-sm text-ivory-muted">{t("spinnerHint")}</p>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("chanceTitle")}</CardTitle>
            <Button variant="ghost" size="sm" aria-expanded={advanced} onClick={() => setAdvanced((v) => !v)}>
              <SlidersHorizontal className="size-4" aria-hidden />
              {t("advanced")}
            </Button>
          </div>
          <ChanceList
            players={onWheel}
            weights={weights}
            chances={chances}
            picked={picks}
            victimId={victimId}
            advanced={advanced}
            locked={spinning}
            onWeightChange={changeWeight}
            onVictimChange={changeVictim}
          />
          <p className="text-xs text-ivory-muted">{t("chanceHint")}</p>
        </section>
      </Card>
    </div>
  );
}
