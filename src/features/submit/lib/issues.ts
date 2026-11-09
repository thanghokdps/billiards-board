import type { ApiIssue } from "@/features/submissions";

import { inputOrder, isFull, scoreProblem, type Draft } from "./draft";

export const STEPS = ["game", "seats", "winner", "score", "note", "send"] as const;
export type Step = (typeof STEPS)[number];

/** The furthest step the draft allows: each step needs the one before it done. */
export function reachOf(draft: Draft): number {
  if (!isFull(draft)) return STEPS.indexOf("seats");
  if (!draft.result) return STEPS.indexOf("winner");
  if (scoreProblem(draft)) return STEPS.indexOf("score");
  return STEPS.length - 1;
}

export type IssueKey = "memberName" | "unknownPlayer" | "duplicate" | "scoreOrder" | "notSeated" | "invalid";

export interface StepIssue {
  step: Step;
  key: IssueKey;
  /** The seat to highlight, when the issue names one. */
  seat?: number;
}

const STEP_OF_FIELD: Record<string, Step> = {
  gameType: "game",
  format: "game",
  sideA: "seats",
  sideB: "seats",
  scoreA: "score",
  scoreB: "score",
  scores: "score",
  bill: "score",
  note: "note",
  submitter: "note",
};

function keyOf({ path, message }: ApiIssue): IssueKey {
  const last = path[path.length - 1];
  // The member API refuses a match its caller is not in, at `["sideA"]` with no seat index.
  if (path.length === 1 && message.includes("one of the players")) return "notSeated";
  if (last === "guestName") return "memberName";
  if (last === "playerId") return "unknownPlayer";
  if (path[0] === "sideB" && message.includes("twice")) return "duplicate";
  if (path[0] === "winnerSide" || path[0] === "scores") return "scoreOrder";
  return "invalid";
}

/** Points a server `invalid_body` back at the step that owns the field, and at the seat when it names one. */
export function stepIssues(issues: ApiIssue[], draft: Draft): StepIssue[] {
  const order = inputOrder(draft);
  return issues.map((issue) => {
    const [field, index] = issue.path;
    const key = keyOf(issue);
    if ((field === "sideA" || field === "sideB") && typeof index === "number") {
      const sideAFirst = draft.format === "1v1v1" ? 2 : draft.seats.length / 2;
      const seat = order[(field === "sideA" ? 0 : sideAFirst) + index];
      return { step: "seats", key, seat };
    }
    if (field === "winnerSide") return { step: key === "scoreOrder" ? "score" : "winner", key };
    return { step: STEP_OF_FIELD[String(field)] ?? "send", key };
  });
}
