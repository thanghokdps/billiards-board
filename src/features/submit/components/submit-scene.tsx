"use client";

import { MotionConfig } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { matchTitle } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { SubmissionInput } from "@/server/submissions/schema";

import { GameStep } from "./game-step";
import { NotePanel } from "./note-panel";
import { ScorePanel } from "./score-panel";
import { SeatTable } from "./seat-table";
import { SeatsPanel } from "./seats-panel";
import { SendPanel } from "./send-panel";
import { SentCard } from "./sent-card";
import { StepNav } from "./step-nav";
import { StepRail } from "./step-rail";
import { SubmitPlaque } from "./submit-plaque";
import { WinnerPanel } from "./winner-panel";
import { postSubmission } from "../api";
import { useDraft } from "../hooks/use-draft";
import { useHydrated } from "../hooks/use-hydrated";
import { useSubmit, type SubmitFn } from "../hooks/use-submit";
import { draftSides, toInput } from "../lib/draft";
import { reachOf, STEPS } from "../lib/issues";
import type { TableMode } from "../lib/table-balls";

interface SubmitSceneProps {
  /** Every active player, guests included. */
  roster: PlayerRef[];
  /** `edit` is the admin's Edit: prefilled, and sending approves with these edits. */
  mode?: "public" | "edit";
  initial?: SubmissionInput;
  onSubmit?: SubmitFn;
  /** Edit only: the save went through. */
  onDone?: () => void;
}

const LAST = STEPS.length - 1;

/** "Ghi trận" as a table, not a form: six steps on one brass plate that turns over once the cue has struck. */
export function SubmitScene({ roster, mode = "public", initial, onSubmit = postSubmission, onDone }: SubmitSceneProps) {
  const t = useTranslations("submit");
  const tc = useTranslations("common");
  const hydrated = useHydrated();
  const edit = mode === "edit";
  const d = useDraft(roster, initial);
  const { draft, people } = d;
  const submit = useSubmit(onSubmit);
  const [index, setIndex] = useState(initial ? LAST : 0);
  const [website, setWebsite] = useState("");
  const [round, setRound] = useState(0);

  const step = STEPS[index]!;
  const sending = submit.phase === "sending";
  const disabled = !hydrated || sending;
  const issues = submit.failure?.issues ?? [];
  const reach = reachOf(draft);
  const seated = draft.seats.map((id) => people.find((p) => p.id === id) ?? null);
  const sides = draftSides(draft, people);
  const tableMode: TableMode = index <= 1 ? "seats" : index === 2 ? "winner" : "send";
  const showTable = step === "seats" || step === "winner" || step === "send";

  async function handleSend() {
    const failure = await submit.send(toInput(draft, people), website, draft);
    const first = failure?.issues[0];
    if (first) return setIndex(STEPS.indexOf(first.step));
    if (!failure && edit) onDone?.();
  }

  function again() {
    d.reset();
    submit.reset();
    setWebsite("");
    setIndex(0);
    setRound((n) => n + 1);
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
      {step === "note" && (
        <NotePanel
          note={draft.note}
          submitter={draft.submitter}
          issues={issues}
          disabled={disabled}
          onNote={d.setNote}
          onSubmitter={d.setSubmitter}
        />
      )}
      {step === "send" && (
        <SendPanel
          draft={draft}
          sides={sides}
          failure={submit.failure}
          sending={sending}
          blocked={reach < LAST}
          edit={edit}
          disabled={!hydrated}
          onSend={handleSend}
        />
      )}
      <StepNav index={index} last={LAST} stuck={index >= reach} disabled={disabled} onGo={setIndex} />
      {/* Honeypot: a person never sees or fills it; a bot that does gets a 200 and nothing is stored. */}
      <div aria-hidden className="sr-only">
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
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
