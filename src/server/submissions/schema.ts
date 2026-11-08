import { z } from "zod";

import { GAME_TYPES, PAIRING_FORMATS } from "@/lib/domain";
import { matchInputSchema, type MatchInput, type PlayerRef } from "@/server/matches/schema";

/** Guest seats get placeholder ids from here up, so the match rules can run before any guest exists. */
const PLACEHOLDER_BASE = 1_000_000;

const seat = z.union([
  z.object({ playerId: z.number().int().positive() }),
  z.object({ guestName: z.string().trim().min(1).max(40) }),
]);

const scoreValue = z.number().int().min(0).max(999);

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((d) => {
    const at = new Date(`${d}T00:00:00Z`);
    // Invalid Date throws in toISOString; "2026-02-31" rolls over to March, so compare the round trip.
    return !Number.isNaN(at.getTime()) && at.toISOString().startsWith(d);
  }, "date does not exist");

const submissionFields = z.object({
  gameType: z.enum(GAME_TYPES),
  format: z.enum(PAIRING_FORMATS),
  sideA: z.array(seat).min(1).max(2),
  sideB: z.array(seat).min(1).max(2),
  winnerSide: z.enum(["a", "b"]),
  scoreA: scoreValue.nullable().optional(),
  scoreB: scoreValue.nullable().optional(),
  /** Per seat, in the order of `[...sideA, ...sideB]`; only a 1v1v1 has them (3 values). */
  scores: z.array(scoreValue).max(3).nullable().optional(),
  bill: z.number().int().min(0).max(10_000_000).nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
  date: calendarDate.optional(),
  submitter: z.string().trim().max(40).optional(),
});

type SubmissionFields = z.infer<typeof submissionFields>;
type Seat = z.infer<typeof seat>;

function seatsOf(sub: Pick<SubmissionFields, "sideA" | "sideB">): Seat[] {
  return [...sub.sideA, ...sub.sideB];
}

/** The same guest name (any case) is one placeholder id, so a name twice on a match is caught as a duplicate player. */
export function placeholderGuestIds(sub: Pick<SubmissionFields, "sideA" | "sideB">): Map<string, number> {
  const ids = new Map<string, number>();
  for (const s of seatsOf(sub)) {
    if (!("guestName" in s)) continue;
    const key = s.guestName.toLowerCase();
    if (!ids.has(key)) ids.set(key, PLACEHOLDER_BASE + ids.size);
  }
  return ids;
}

/** `guestIds` maps each lowercase guest name of the submission to a player id (real or placeholder). */
export function toMatchInput(sub: SubmissionFields, guestIds: ReadonlyMap<string, number>): MatchInput {
  const idOf = (s: Seat): number => {
    if ("playerId" in s) return s.playerId;
    const id = guestIds.get(s.guestName.toLowerCase());
    if (id === undefined) throw new Error(`guest "${s.guestName}" has no id`);
    return id;
  };
  const sideA = sub.sideA.map(idOf);
  const sideB = sub.sideB.map(idOf);
  const seated = [...sideA, ...sideB];
  return {
    gameType: sub.gameType,
    format: sub.format,
    sideA,
    sideB,
    winnerSide: sub.winnerSide,
    scoreA: sub.scoreA,
    scoreB: sub.scoreB,
    scores: sub.scores?.length ? sub.scores.map((score, i) => ({ playerId: seated[i]!, score })) : undefined,
    bill: sub.bill,
    note: sub.note,
    date: sub.date,
  };
}

/** Runs every `matchInputSchema` rule on the mapped seats and re-emits its issues at the same paths. */
function refineWithMatchRules(sub: SubmissionFields, ctx: z.RefinementCtx): void {
  if (sub.scores?.length && sub.scores.length !== sub.sideA.length + sub.sideB.length) {
    ctx.addIssue({ code: "custom", path: ["scores"], message: "scores must match the seats, one per player" });
    return;
  }
  const mapped = matchInputSchema.safeParse(toMatchInput(sub, placeholderGuestIds(sub)));
  if (mapped.success) return;
  for (const issue of mapped.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
}

/** A submitted match, also the shape the admin edits before approving. */
export const submissionInputSchema = submissionFields.superRefine(refineWithMatchRules);
export type SubmissionInput = z.infer<typeof submissionInputSchema>;

/** The public POST body: the input plus `website`, a honeypot real users never see or fill. */
export const submitBodySchema = submissionFields
  .extend({ website: z.string().optional() })
  .superRefine(refineWithMatchRules);

export const approveBodySchema = z.object({
  edited: submissionInputSchema.optional(),
  via: z.enum(["chat", "ui"]).default("ui"),
});

export const rejectBodySchema = z.object({ via: z.enum(["chat", "ui"]).default("ui") });

/** A guest the submitter typed: no `players` row exists until the admin approves. */
export interface NewGuestRef {
  name: string;
  guest: true;
  isNew: true;
}

export type SeatView = PlayerRef | NewGuestRef;

/** What the admin sees for a submission; never holds the IP hash. */
export interface SubmissionView {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt: string | null;
  /** Set once approved. */
  matchId: string | null;
  submitter: string | null;
  /** The body in force (`edited` when the admin changed it), for prefilling the edit form. */
  input: SubmissionInput;
  gameType: SubmissionInput["gameType"];
  format: SubmissionInput["format"];
  sideA: SeatView[];
  sideB: SeatView[];
  winnerSide: "a" | "b";
  scoreA: number | null;
  scoreB: number | null;
  scores: number[] | null;
  bill: number | null;
  note: string | null;
  date: string | null;
}
