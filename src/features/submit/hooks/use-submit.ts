import { useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";
import type { SubmissionInput } from "@/server/submissions/schema";

import { SubmitError } from "../api";
import type { Draft } from "../lib/draft";
import { stepIssues, type StepIssue } from "../lib/issues";

/** How long the cue takes to strike before the card turns over. */
const STRIKE_MS = 1100;

export type Phase = "idle" | "sending" | "sent";

export interface Failure {
  code: string;
  issues: StepIssue[];
  /** A 429: whole minutes until the sender may try again. */
  waitMinutes: number | null;
}

export type SubmitFn = (input: SubmissionInput, website: string) => Promise<void>;

function failureOf(error: unknown, draft: Draft): Failure {
  if (error instanceof SubmitError) {
    const waitMinutes = error.retryAfterSeconds ? Math.max(1, Math.ceil(error.retryAfterSeconds / 60)) : null;
    return { code: error.code, issues: stepIssues(error.issues, draft), waitMinutes };
  }
  // An admin call throws `AdminApiError`, which carries only the code.
  const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "internal";
  return { code, issues: [], waitMinutes: null };
}

/** The send: the cue strikes while the request is out, and the card turns over only when both are done. */
export function useSubmit(onSubmit: SubmitFn) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [strike, setStrike] = useState(0);
  const [failure, setFailure] = useState<Failure | null>(null);

  /** Resolves to null when sent, or to what went wrong. */
  async function send(input: SubmissionInput, website: string, draft: Draft): Promise<Failure | null> {
    setPhase("sending");
    setFailure(null);
    setStrike((n) => n + 1);
    const pause = new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : STRIKE_MS));
    try {
      await Promise.all([onSubmit(input, website), pause]);
      setPhase("sent");
      return null;
    } catch (error) {
      await pause;
      const failed = failureOf(error, draft);
      setFailure(failed);
      setPhase("idle");
      return failed;
    }
  }

  const reset = () => {
    setPhase("idle");
    setFailure(null);
  };

  return { phase, strike, failure, send, reset };
}
