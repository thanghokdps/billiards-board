"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";

import { CancelMatch, memberMatchesApi } from "@/features/submissions";
import { useRouter } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";
import type { ScheduleInput, SubmissionInput, TempMatchDetail } from "@/server/submissions/schema";

import { SubmitScene } from "./submit-scene";
import { fromInput, fromSchedule, memberDraft } from "../lib/draft";

interface MemberSubmitProps {
  roster: PlayerRef[];
  /** The signed-in member: seated first, and always one of the players. */
  me: PlayerRef;
  /** The member's own temp match when the page was opened with `?id=`. */
  match: TempMatchDetail | null;
}

/** A signed-in member's "Ghi trận": a new match, or one from Home that is still to be played or waits for the admin. */
export function MemberSubmit({ roster, me, match }: MemberSubmitProps) {
  const t = useTranslations("submit");
  const router = useRouter();
  // The temp match this page works on. A send on a fresh draft creates it first, so a retry must not create a second.
  const matchId = useRef(match?.view.id ?? null);
  const unplayed = match !== null && match.input === null;

  async function sendResult(input: SubmissionInput) {
    const { gameType, format, sideA, sideB } = input;
    matchId.current ??= (await memberMatchesApi.create({ gameType, format, sideA, sideB })).match.id;
    await memberMatchesApi.result(matchId.current, input);
  }

  async function plan(schedule: ScheduleInput) {
    const existing = matchId.current;
    if (existing) await memberMatchesApi.edit(existing, schedule);
    else await memberMatchesApi.create(schedule);
    toast.success(t(existing ? "schedule.saved" : "schedule.done"));
    router.push("/");
  }

  const blank = memberDraft(me);
  const initial = match ? (match.input ? fromInput(match.input) : fromSchedule(match.schedule)) : blank;
  return (
    <SubmitScene
      roster={roster}
      mode="member"
      initial={initial}
      blank={blank}
      start={match ? (match.input ? "send" : "winner") : "game"}
      onSubmit={sendResult}
      onAgain={() => {
        matchId.current = null;
        // Drop `?id=` so the page stops holding the match just sent (its cancel button and schedule).
        if (match) router.replace("/submit");
      }}
      schedule={
        match?.input ? undefined : { at: match?.schedule.scheduledAt ?? null, saved: unplayed, onSchedule: plan }
      }
      footer={
        unplayed && (
          <div className="flex justify-center">
            <CancelMatch
              id={match.view.id}
              onCancelled={() => {
                toast.success(t("cancel.done"));
                router.push("/");
              }}
            />
          </div>
        )
      }
    />
  );
}
