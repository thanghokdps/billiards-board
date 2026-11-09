import { useState } from "react";

import { MemberApiError } from "@/features/submissions";
import { prefersReducedMotion } from "@/lib/motion";
import type { ScheduleInput, SubmissionInput } from "@/server/submissions/schema";

import type { Draft } from "../lib/draft";
import { stepIssues, type StepIssue } from "../lib/issues";

/** How long the cue takes to strike before the card turns over. */
const STRIKE_MS = 1100;

/** `scheduling` and `scheduled` are the "schedule now, result later" path: no cue, and the page leaves once it is done. */
export type Phase = "idle" | "sending" | "sent" | "scheduling" | "scheduled";

export interface Failure {
  code: string;
  issues: StepIssue[];
  /** Which button failed, so each panel shows only its own error. */
  via: "send" | "schedule";
}

export type SubmitFn = (input: SubmissionInput) => Promise<void>;
export type ScheduleFn = (input: ScheduleInput) => Promise<void>;

function failureOf(error: unknown, draft: Draft, via: Failure["via"]): Failure {
  if (error instanceof MemberApiError) return { code: error.code, issues: stepIssues(error.issues, draft), via };
  // An admin call throws `AdminApiError`, which carries only the code.
  const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "internal";
  return { code, issues: [], via };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : ms));

/** The send: the cue strikes while the request is out, and the card turns over only when both are done. */
export function useSubmit(onSubmit: SubmitFn, onSchedule: ScheduleFn = async () => {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [strike, setStrike] = useState(0);
  const [failure, setFailure] = useState<Failure | null>(null);

  /** Resolves to null when it went through, or to what went wrong. */
  async function run(task: () => Promise<void>, draft: Draft, via: Failure["via"], minMs: number) {
    setPhase(via === "send" ? "sending" : "scheduling");
    setFailure(null);
    const pause = wait(minMs);
    try {
      await Promise.all([task(), pause]);
      setPhase(via === "send" ? "sent" : "scheduled");
      return null;
    } catch (error) {
      await pause;
      const failed = failureOf(error, draft, via);
      setFailure(failed);
      setPhase("idle");
      return failed;
    }
  }

  function send(input: SubmissionInput, draft: Draft): Promise<Failure | null> {
    setStrike((n) => n + 1);
    return run(() => onSubmit(input), draft, "send", STRIKE_MS);
  }

  function schedule(input: ScheduleInput, draft: Draft): Promise<Failure | null> {
    return run(() => onSchedule(input), draft, "schedule", 0);
  }

  const reset = () => {
    setPhase("idle");
    setFailure(null);
  };

  return { phase, strike, failure, send, schedule, reset };
}
