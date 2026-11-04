"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/misc";
import { useChat } from "@/features/shell";
import { applyVictim, probabilities, type WheelEntry } from "@/lib/wheel";
import type { PlayerRef } from "@/server/matches/schema";

import { ChanceList } from "./chance-list";
import { ParticipantChip } from "./participant-chip";
import { WheelPanel } from "./wheel-panel";

const MULTIPLIERS = [2, 3, 5, 6] as const;
const MODES = ["1v1", "2v2"] as const;

interface WheelStudioProps {
  /** Every active player. */
  players: PlayerRef[];
  /** Who is in at the start: today's attendees, else everyone. */
  defaultIncluded: number[];
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
export function WheelStudio({ players, defaultIncluded, admin }: WheelStudioProps) {
  const t = useTranslations("wheel");
  const chat = useChat();
  const hintId = useId();
  const [included, setIncluded] = useState<number[]>(defaultIncluded);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<(typeof MODES)[number]>("1v1");
  const [victimId, setVictimId] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  if (players.length === 0) return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />;

  const participants = players.filter((p) => included.includes(p.id));
  const victim = participants.find((p) => p.id === victimId) ?? null;
  const chances = probabilities(participants.filter((p) => !picks.includes(p.id)).map((p) => toEntry(p, weights)));

  /** ×N for everyone but the victim (a player on weight 0 stays hidden). */
  function reweigh(who: PlayerRef[], nextVictim: number, nextMultiplier: number) {
    const weighted = applyVictim(
      who.map((p) => toEntry(p, weights)),
      nextVictim,
      nextMultiplier,
    );
    setWeights({ ...weights, ...Object.fromEntries(weighted.map((e) => [e.id, e.weight])) });
  }

  function toggleParticipant(id: number) {
    setIncluded((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    if (victimId === id) setVictimId(null);
    setPicks([]);
  }

  function changeVictim(id: number | null) {
    setVictimId(id);
    if (id === null) {
      setMultiplier(null);
      setWeights({});
      return;
    }
    const joining = players.find((p) => p.id === id && !included.includes(id));
    if (joining) setIncluded((ids) => [...ids, id]);
    if (multiplier !== null) reweigh(joining ? [...participants, joining] : participants, id, multiplier);
  }

  function chooseMultiplier(n: number) {
    if (victimId === null) return;
    setMultiplier(n);
    reweigh(participants, victimId, n);
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

  function changeMode(next: (typeof MODES)[number]) {
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
            disabled={spinning || victim === null}
            aria-label={t("victimMultiplier", { n })}
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
      <Card className="lg:col-span-3">
        <CardBody>
          <WheelPanel
            players={participants}
            weights={weights}
            mode={mode}
            picks={picks}
            onPicksChange={setPicks}
            onSpinningChange={setSpinning}
            belowWheel={shortcuts}
            pairingActions={
              admin
                ? (pairing) => (
                    <Button
                      variant="felt"
                      onClick={() =>
                        chat.open(
                          t("createMatchPrompt", {
                            sideA: pairing.sideA.map((p) => p.name).join(" & "),
                            sideB: pairing.sideB.map((p) => p.name).join(" & "),
                          }),
                          "prefill",
                        )
                      }
                    >
                      {t("createMatch")}
                    </Button>
                  )
                : undefined
            }
          />
        </CardBody>
      </Card>

      <div aria-label={t("controlsSection")} role="group" className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("modeTitle")}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            <div role="group" aria-label={t("modeTitle")} className="flex gap-2">
              {MODES.map((m) => (
                <Chip
                  key={m}
                  selected={mode === m}
                  disabled={spinning}
                  className="h-11 flex-1 justify-center"
                  onClick={() => changeMode(m)}
                >
                  <span className="digits text-lg font-bold">{t(m === "1v1" ? "mode1v1" : "mode2v2")}</span>
                </Chip>
              ))}
            </div>
            <p className="text-sm text-ivory-muted">{t(mode === "1v1" ? "modeHint1v1" : "modeHint2v2")}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("participantsTitle")}</CardTitle>
            <span className="digits text-sm font-semibold text-ivory-muted">
              {t("participantsCount", { selected: participants.length, total: players.length })}
            </span>
          </CardHeader>
          <CardBody className="space-y-3">
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("chanceTitle")}</CardTitle>
            <Button variant="ghost" size="sm" aria-expanded={advanced} onClick={() => setAdvanced((v) => !v)}>
              <SlidersHorizontal className="size-4" aria-hidden />
              {t("advanced")}
            </Button>
          </CardHeader>
          <CardBody>
            <ChanceList
              players={participants}
              weights={weights}
              chances={chances}
              picked={picks}
              victimId={victimId}
              advanced={advanced}
              locked={spinning}
              onWeightChange={changeWeight}
              onVictimChange={changeVictim}
            />
            <p className="mt-3 text-xs text-ivory-faint">{t("chanceHint")}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
