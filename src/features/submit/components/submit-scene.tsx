"use client";

import { MotionConfig } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { matchTitle } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import { GameStep } from "./game-step";
import { NotePanel } from "./note-panel";
import { ScheduleBlock } from "./schedule-block";
import { ScorePanel } from "./score-panel";
import { SeatTable } from "./seat-table";
import { SeatsPanel } from "./seats-panel";
import { SendPanel } from "./send-panel";
import { SentCard } from "./sent-card";
import { StepNav } from "./step-nav";
import { StepRail } from "./step-rail";
import { SubmitPlaque } from "./submit-plaque";
import { WinnerPanel } from "./winner-panel";
import { useDraft } from "../hooks/use-draft";
import { useHydrated } from "../hooks/use-hydrated";
import { useSubmit, type Failure, type ScheduleFn, type SubmitFn } from "../hooks/use-submit";
import { draftSides, emptyDraft, isFull, toInput, toSchedule, type Draft } from "../lib/draft";
import { reachOf, STEPS, type Step } from "../lib/issues";
import type { TableMode } from "../lib/table-balls";

interface SubmitSceneProps {
  /** Every active player, guests included. */
  roster: PlayerRef[];
  /** `edit` is the admin's Edit: sending approves with these edits. `member` is a signed-in player logging a match. */
  mode: "member" | "edit";
  initial: Draft;
  /** What "Ghi trận khác" starts over from; a member's own draft has them seated first. */
  blank?: Draft;
  /** The step the scene opens on. */
  start?: Step;
  onSubmit: SubmitFn;
  /** Edit only: the save went through. */
  onDone?: () => void;
  /** Member only: the card was turned over and the member asked for another match. */
  onAgain?: () => void;
  /** Member only: adds "schedule now, result later" to the seats step. */
  schedule?: { at: string | null; saved: boolean; onSchedule: ScheduleFn };
  /** Under the step buttons, e.g. cancelling the match. */
  footer?: ReactNode;
}

const LAST = STEPS.length - 1;

/** "Ghi trận" as a table, not a form: six steps on one brass plate that turns over once the cue has struck. */
export function SubmitScene({
  roster,
  mode,
  initial,
  blank = emptyDraft(),
  start = "game",
  onSubmit,
  onDone,
  onAgain,
  schedule,
  footer,
}: SubmitSceneProps) {
  const t = useTranslations("submit");
  const tc = useTranslations("common");
  const hydrated = useHydrated();
  const edit = mode === "edit";
  const d = useDraft(roster, initial, blank);
  const { draft, people } = d;
  const submit = useSubmit(onSubmit, schedule?.onSchedule);
  const [index, setIndex] = useState(STEPS.indexOf(start));
  const [scheduledAt, setScheduledAt] = useState(schedule?.at ?? null);
  const [round, setRound] = useState(0);

  const step = STEPS[index]!;
  const sending = submit.phase === "sending";
  const scheduling = submit.phase === "scheduling" || submit.phase === "scheduled";
  const disabled = !hydrated || sending || scheduling;
  const issues = submit.failure?.issues ?? [];
  const reach = reachOf(draft);
  const seated = draft.seats.map((id) => people.find((p) => p.id === id) ?? null);
  const sides = draftSides(draft, people);
  const tableMode: TableMode = index <= 1 ? "seats" : index === 2 ? "winner" : "send";
  const showTable = step === "seats" || step === "winner" || step === "send";

  /** A refusal from the server jumps to the first step it names. */
  function showFirstIssue(failure: Failure | null) {
    const first = failure?.issues[0];
    if (first) setIndex(STEPS.indexOf(first.step));
  }

  async function handleSend() {
    const failure = await submit.send(toInput(draft, people), draft);
    showFirstIssue(failure);
    if (!failure && edit) onDone?.();
  }

  async function handleSchedule() {
    showFirstIssue(await submit.schedule(toSchedule(draft, people, scheduledAt), draft));
  }

  function again() {
    d.reset();
    submit.reset();
    setScheduledAt(null);
    setIndex(0);
    setRound((n) => n + 1);
    onAgain?.();
  }

  const front = (
    <div className="space-y-4">
      <StepRail current={index} reach={reach} flagged={issues.map((i) => i.step)} disabled={disabled} onGo={setIndex} />
      <h2 aria-live="polite" className="font-display text-2xl leading-tight font-bold">
        {t(`titles.${step}`)}
      </h2>
      <div className={cn(!showTable && "hidden")}>
        <SeatTable
          key={round}
          draft={draft}
          people={people}
          mode={tableMode}
          target={d.target}
          flaggedSeats={issues.flatMap((i) => (i.seat === undefined ? [] : [i.seat]))}
          strike={submit.strike}
          sending={sending}
          disabled={disabled}
          onBench={d.sit}
          onUnseat={d.unseat}
          onTarget={d.setTarget}
          onPickSeat={d.pickSeat}
        />
      </div>
      {step === "game" && (
        <GameStep
          gameType={draft.gameType}
          format={draft.format}
          disabled={disabled}
          onGame={d.setGame}
          onFormat={d.setFormat}
        />
      )}
      {step === "seats" && (
        <SeatsPanel
          people={people}
          newGuests={draft.newGuests}
          filled={draft.seats.filter((s) => s !== null).length}
          total={draft.seats.length}
          issues={issues}
          disabled={disabled}
          onAddGuest={d.addGuest}
          onRemoveGuest={d.removeGuest}
        />
      )}
      {step === "seats" && schedule && isFull(draft) && (
        <ScheduleBlock
          at={hydrated ? scheduledAt : null}
          saved={schedule.saved}
          busy={scheduling}
          failure={submit.failure}
          disabled={disabled}
          onAt={setScheduledAt}
          onSchedule={handleSchedule}
        />
      )}
      {step === "winner" && (
        <WinnerPanel draft={draft} seated={seated} issues={issues} disabled={disabled} onPickSeat={d.pickSeat} />
      )}
      {step === "score" && (
        <ScorePanel
          draft={draft}
          seated={seated}
          sides={sides}
          issues={issues}
          disabled={disabled}
          onStep={d.stepScore}
          onAddBill={d.addBill}
          onSetBill={d.setBill}
        />
      )}
      {step === "note" && <NotePanel note={draft.note} issues={issues} disabled={disabled} onNote={d.setNote} />}
      {step === "send" && (
        <SendPanel
          draft={draft}
          sides={sides}
          failure={submit.failure}
          sending={sending}
          blocked={reach < LAST}
          edit={edit}
          disabled={!hydrated || scheduling}
          onSend={handleSend}
        />
      )}
      <StepNav index={index} last={LAST} stuck={index >= reach} disabled={disabled} onGo={setIndex} />
      {footer}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <SubmitPlaque
        flipped={submit.phase === "sent" && !edit}
        front={front}
        back={<SentCard title={matchTitle({ format: draft.format, ...sides }, tc("vs"))} onAgain={again} />}
      />
    </MotionConfig>
  );
}
