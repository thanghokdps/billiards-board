import "server-only";

import { tool } from "langchain";
import { z } from "zod";

import {
  TOOL_NAMES,
  type CreateProposal,
  type DeleteProposal,
  type MatchList,
  type NameProblem,
  type NeedsInput,
  type ProposedMatch,
  type ToolFailure,
  type UpdateProposal,
} from "@/lib/agent-results";
import { formatOfSides, formatTime, GAME_TYPES, GUEST_SEAT, MATCH_TAGS, type MatchFormat } from "@/lib/domain";
import { findMatches } from "@/server/matches/repository";
import { matchInputSchema, type MatchPatch, type MatchView } from "@/server/matches/schema";
import { listPlayers } from "@/server/players/repository";

import { findTargetMatch, GAME_TYPE_OPTIONS, json, requireContext, resolveNames, todayIn } from "./shared";

type Roster = Awaited<ReturnType<typeof listPlayers>>;

const name = z.string().min(1).max(40);
const names = z.array(name).min(1).max(2);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const matchRef = z
  .string()
  .describe('"latest" for the most recent match ("trận vừa rồi"), or a match id from list_matches');

const draftSchema = z.object({
  gameType: z.enum(GAME_TYPES).nullable().describe("null when the user did not say it; never guess"),
  sideA: names.nullable().describe("player names exactly as the user wrote them; null for a 1v1v1 or a guest match"),
  sideB: names.nullable(),
  threeWay: z
    .object({
      players: z.array(name).length(3).describe("the three names exactly as the user wrote them"),
      loser: name.nullable().describe("who came last and pays; null when the user did not say"),
      scores: z
        .array(z.number().int().min(0).max(999))
        .length(3)
        .nullable()
        .describe("each player's score, in the order of players; null unless all three were said"),
    })
    .nullable()
    .describe("only for a 1v1v1, three players each on their own; otherwise null"),
  guest: z
    .object({
      player: name.describe("the one player against the guest, exactly as the user wrote it"),
      loser: name
        .nullable()
        .describe(
          `that player's name, or "${GUEST_SEAT.name}" when the player won ("Dũ thắng guest"); null only when the user said neither`,
        ),
    })
    .nullable()
    .describe("only for a guest match (du đấu); otherwise null"),
  winnerSide: z
    .enum(["a", "b"])
    .nullable()
    .describe("null when the user did not say who won; null for a 1v1v1 or a guest match"),
  scoreA: z.number().int().min(0).max(999).nullable(),
  scoreB: z.number().int().min(0).max(999).nullable(),
  bill: z.number().int().min(0).max(10_000_000).nullable().describe('VND; "45k" = 45000'),
  note: z.string().max(280).nullable(),
  tags: z
    .array(z.string())
    .max(6)
    .nullable()
    .describe(`only from: ${MATCH_TAGS.join(", ")}`),
  date: date.nullable().describe("YYYY-MM-DD; null = today"),
});

function needs(question: NeedsInput["question"], options?: NeedsInput["options"]): NeedsInput {
  return { status: "needs_input", question, ...(options ? { options } : {}) };
}

type Draft = z.infer<typeof draftSchema>;

interface SeatedDraft {
  format: MatchFormat;
  sideA: ProposedMatch["sideA"];
  sideB: ProposedMatch["sideB"];
  winnerSide: "a" | "b";
  scoreA: number | null;
  scoreB: number | null;
  scores: { playerId: number; score: number }[];
}

type Seating = SeatedDraft | NeedsInput | NameProblem | ToolFailure;

function seatThreeWay(draft: NonNullable<Draft["threeWay"]>, roster: Roster): Seating {
  const everyone = resolveNames(draft.players, roster);
  if (!everyone.ok) return everyone.problem;
  if (!draft.loser)
    return needs(
      "loser",
      everyone.refs.map((p) => ({ label: p.name, value: p.name })),
    );
  const loser = resolveNames([draft.loser], roster);
  if (!loser.ok) return loser.problem;
  if (!everyone.ids.includes(loser.ids[0]!)) return { status: "error", message: "The loser must be one of the three." };
  const { scores } = draft;
  return {
    format: "1v1v1",
    sideA: everyone.refs.filter((p) => p.id !== loser.ids[0]),
    sideB: loser.refs,
    winnerSide: "a",
    scoreA: null,
    scoreB: null,
    scores: scores ? everyone.ids.map((playerId, i) => ({ playerId, score: scores[i]! })) : [],
  };
}

/** Who won a guest match given who lost: "a" is the player, "b" the guest. */
function guestWinnerSide(loser: string, playerId: number, roster: Roster): "a" | "b" | NameProblem | ToolFailure {
  if (loser.trim().toLowerCase() === GUEST_SEAT.name.toLowerCase()) return "a";
  const resolved = resolveNames([loser], roster);
  if (!resolved.ok) return resolved.problem;
  if (resolved.ids[0] !== playerId)
    return { status: "error", message: `The loser must be the player or ${GUEST_SEAT.name}.` };
  return "b";
}

function seatGuest(draft: NonNullable<Draft["guest"]>, roster: Roster): Seating {
  const player = resolveNames([draft.player], roster);
  if (!player.ok) return player.problem;
  const { name: playerName } = player.refs[0]!;
  if (!draft.loser)
    return needs("guest_loser", [
      { label: playerName, value: playerName },
      { label: GUEST_SEAT.name, value: GUEST_SEAT.name },
    ]);
  const winnerSide = guestWinnerSide(draft.loser, player.ids[0]!, roster);
  if (typeof winnerSide !== "string") return winnerSide;
  return {
    format: "guest",
    sideA: player.refs,
    sideB: [],
    winnerSide,
    scoreA: null,
    scoreB: null,
    scores: [],
  };
}

function seatDraft(draft: Draft, roster: Roster): Seating {
  if (draft.threeWay) return seatThreeWay(draft.threeWay, roster);
  if (draft.guest) return seatGuest(draft.guest, roster);
  if (!draft.sideA || !draft.sideB) return needs("players");
  const a = resolveNames(draft.sideA, roster);
  if (!a.ok) return a.problem;
  const b = resolveNames(draft.sideB, roster);
  if (!b.ok) return b.problem;
  if (!draft.winnerSide) {
    return needs("winner", [
      { label: a.refs.map((p) => p.name).join(" + "), value: "a" },
      { label: b.refs.map((p) => p.name).join(" + "), value: "b" },
    ]);
  }
  return {
    format: a.ids.length === 2 ? "2v2" : "1v1",
    sideA: a.refs,
    sideB: b.refs,
    winnerSide: draft.winnerSide,
    scoreA: draft.scoreA,
    scoreB: draft.scoreB,
    scores: [],
  };
}

export const listMatchesTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const day = input.date ?? todayIn(context);
    const list = await findMatches({ from: day, to: day, gameType: input.gameType, order: "desc" });
    const result: MatchList = {
      status: "ok",
      matches: list.slice(0, 12).map((m, i) => ({
        ...m,
        time: formatTime(m.playedAt, context.locale, context.timeZone),
        label: `#${i + 1}`,
      })),
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.listMatches,
    description: [
      "- Lists one day's matches, newest first, with id, time (HH:mm), players, score, bill.",
      `- Use to find the target before ${TOOL_NAMES.proposeUpdate} or ${TOOL_NAMES.proposeDelete} when the user names a time, game or players.`,
      '- Not needed for the most recent match: pass "latest" to the propose tools.',
    ].join("\n"),
    schema: z.object({ date: date.nullable().describe("null = today"), gameType: z.enum(GAME_TYPES).nullable() }),
  },
);

export const proposeMatchesTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const roster = await listPlayers();
    const today = todayIn(context);
    const proposed: ProposedMatch[] = [];
    for (const draft of input.matches) {
      if (!draft.gameType) return json(needs("game_type", GAME_TYPE_OPTIONS));
      const seated = seatDraft(draft, roster);
      if ("status" in seated) return json(seated);
      const parsed = matchInputSchema.safeParse({
        gameType: draft.gameType,
        format: seated.format,
        sideA: seated.sideA.map((p) => p.id),
        sideB: seated.sideB.map((p) => p.id),
        winnerSide: seated.winnerSide,
        scoreA: seated.scoreA,
        scoreB: seated.scoreB,
        scores: seated.scores,
        bill: seated.format === "guest" ? null : draft.bill,
        note: draft.note,
        tags: (draft.tags ?? []).filter((t) => (MATCH_TAGS as readonly string[]).includes(t)),
        date: draft.date ?? today,
      });
      if (!parsed.success)
        return json({ status: "error", message: parsed.error.issues.map((i) => i.message).join("; ") });
      proposed.push({ input: parsed.data, sideA: seated.sideA, sideB: seated.sideB });
    }
    const result: CreateProposal = { status: "proposal", kind: "create", date: today, matches: proposed };
    return json(result);
  },
  {
    name: TOOL_NAMES.proposeMatches,
    description: [
      "- Prepares one or more finished matches for the admin to confirm; it saves nothing.",
      "- Returns a proposal (the chat shows a confirm card with Save) or what is missing / which name is unclear.",
      "- One entry per match, in the order the user listed them. 1v1 = one name per side, 2v2 = two.",
      "- 1v1v1 = threeWay with the three names and the loser; sideA, sideB and winnerSide stay null.",
      "- Guest match = guest with the player and the loser, one entry per match; sideA, sideB and winnerSide stay null.",
    ].join("\n"),
    schema: z.object({ matches: z.array(draftSchema).min(1).max(10) }),
  },
);

// partial: the model may send only the fields that change, and a missing key must not fail the whole tool.
const patchSchema = z
  .object({
    gameType: z.enum(GAME_TYPES).nullable(),
    sideA: names.nullable().describe("in a 1v1v1, the two winners"),
    sideB: names.nullable().describe("in a 1v1v1, the loser"),
    winnerSide: z.enum(["a", "b"]).nullable().describe("never for a 1v1v1 or a guest match: use loser"),
    loser: name
      .nullable()
      .describe(`1v1v1: which of the three came last. Guest match: the player's name or "${GUEST_SEAT.name}"`),
    scoreA: z.number().int().min(0).max(999).nullable(),
    scoreB: z.number().int().min(0).max(999).nullable(),
    scores: z
      .array(z.object({ name, score: z.number().int().min(0).max(999) }))
      .max(3)
      .nullable()
      .describe("1v1v1 only, instead of scoreA and scoreB"),
    bill: z.number().int().min(0).max(10_000_000).nullable().describe('VND; "45k" = 45000'),
    note: z.string().max(280).nullable(),
    tags: z.array(z.string()).max(6).nullable(),
  })
  .partial();

type Refs = { a?: MatchView["sideA"]; b?: MatchView["sideB"] };

/** Applies the 1v1v1-only changes to `patch` and `refs`, or returns what stops them. */
function applyThreeWayChanges(
  target: MatchView,
  changes: z.infer<typeof patchSchema>,
  roster: Roster,
  patch: MatchPatch,
  refs: Refs,
): NameProblem | ToolFailure | null {
  if (!changes.loser && !changes.scores) return null;
  if (target.format !== "1v1v1") return { status: "error", message: "Only a 1v1v1 has a loser field or scores." };
  if (changes.loser) {
    const loser = resolveNames([changes.loser], roster);
    if (!loser.ok) return loser.problem;
    const everyone = [...target.sideA, ...target.sideB];
    if (!everyone.some((p) => p.id === loser.ids[0]))
      return { status: "error", message: "The loser must be one of the three." };
    refs.a = everyone.filter((p) => p.id !== loser.ids[0]);
    refs.b = loser.refs;
    patch.sideA = refs.a.map((p) => p.id);
    patch.sideB = loser.ids;
  }
  if (changes.scores) {
    const given = resolveNames(
      changes.scores.map((s) => s.name),
      roster,
    );
    if (!given.ok) return given.problem;
    const scores = changes.scores;
    patch.scores = [
      ...target.scores.filter((s) => !given.ids.includes(s.playerId)),
      ...given.ids.map((playerId, i) => ({ playerId, score: scores[i]!.score })),
    ];
  }
  return null;
}

/** Applies a new loser of a guest match to `patch`, or returns what stops it. */
function applyGuestLoser(
  target: MatchView,
  changes: z.infer<typeof patchSchema>,
  roster: Roster,
  patch: MatchPatch,
): NameProblem | ToolFailure | null {
  if (!changes.loser) return null;
  const playerId = patch.sideA?.[0] ?? target.sideA[0]?.id;
  if (playerId === undefined) return { status: "error", message: "This guest match has no player." };
  const winnerSide = guestWinnerSide(changes.loser, playerId, roster);
  if (typeof winnerSide !== "string") return winnerSide;
  patch.winnerSide = winnerSide;
  return null;
}

const hasFixedSeats = (format: MatchFormat | null) => format === "1v1v1" || format === "guest";

/** Merges the requested change onto the match for the before → after preview. */
function preview(before: MatchView, patch: MatchPatch, refs: Refs): MatchView {
  return {
    ...before,
    ...patch,
    format: patch.format ?? before.format,
    sideA: refs.a ?? before.sideA,
    sideB: refs.b ?? before.sideB,
    tags: patch.tags ?? before.tags,
  } as MatchView;
}

export const proposeUpdateTool = tool(
  async (input, runtime) => {
    requireContext(runtime);
    const target = await findTargetMatch(input.match);
    if ("status" in target) return json(target);
    const roster = await listPlayers();
    const changes = input.changes;
    const patch: MatchPatch = {};
    const refs: Refs = {};
    if (changes.gameType) patch.gameType = changes.gameType;
    if (changes.winnerSide) patch.winnerSide = changes.winnerSide;
    if (changes.scoreA != null) patch.scoreA = changes.scoreA;
    if (changes.scoreB != null) patch.scoreB = changes.scoreB;
    if (changes.bill != null) patch.bill = changes.bill;
    if (changes.note != null) patch.note = changes.note;
    if (changes.tags) patch.tags = changes.tags.filter((t) => (MATCH_TAGS as readonly string[]).includes(t));
    for (const side of ["sideA", "sideB"] as const) {
      const list = changes[side];
      if (!list) continue;
      const resolved = resolveNames(list, roster);
      if (!resolved.ok) return json(resolved.problem);
      patch[side] = resolved.ids;
      refs[side === "sideA" ? "a" : "b"] = resolved.refs;
    }
    const stopped =
      target.format === "guest"
        ? applyGuestLoser(target, changes, roster, patch)
        : applyThreeWayChanges(target, changes, roster, patch, refs);
    if (stopped) return json(stopped);
    if (patch.sideA || patch.sideB) {
      const format = formatOfSides((patch.sideA ?? target.sideA).length, (patch.sideB ?? target.sideB).length);
      if (format !== target.format && (hasFixedSeats(format) || hasFixedSeats(target.format)))
        return json({
          status: "error",
          message: "A match cannot switch to or from 1v1v1 or guest: delete it and log it again.",
        });
      if (format) patch.format = format;
    }
    // A new score with no new winner: the higher score wins (no draws).
    const scoreA = patch.scoreA ?? target.scoreA;
    const scoreB = patch.scoreB ?? target.scoreB;
    if (!patch.winnerSide && scoreA != null && scoreB != null && scoreA !== scoreB)
      patch.winnerSide = scoreA > scoreB ? "a" : "b";
    if (Object.keys(patch).length === 0) return json({ status: "error", message: "Nothing to change." });
    const after = preview(target, patch, refs);
    const check = matchInputSchema.safeParse({
      ...after,
      sideA: after.sideA.map((p) => p.id),
      sideB: after.sideB.map((p) => p.id),
    });
    if (!check.success) return json({ status: "error", message: check.error.issues.map((i) => i.message).join("; ") });
    const result: UpdateProposal = {
      status: "proposal",
      kind: "update",
      matchId: target.id,
      before: target,
      after,
      patch,
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.proposeUpdate,
    description: [
      "- Prepares a change to one recorded match (score, winner, players, game type, bill, note, tags); saves nothing.",
      '- Also sets a bill: "trận vừa rồi bill 45k" → changes.bill = 45000.',
      "- In a 1v1v1, change who lost with changes.loser and the score with changes.scores.",
      "- In a guest match, change who lost with changes.loser; it has no score and no bill to change.",
      "- Returns a before → after proposal the admin confirms in the chat. Only fields the user changes are non-null.",
    ].join("\n"),
    schema: z.object({ match: matchRef, changes: patchSchema }),
  },
);

export const proposeDeleteTool = tool(
  async (input, runtime) => {
    requireContext(runtime);
    const target = await findTargetMatch(input.match);
    if ("status" in target) return json(target);
    const result: DeleteProposal = { status: "proposal", kind: "delete", match: target };
    return json(result);
  },
  {
    name: TOOL_NAMES.proposeDelete,
    description: [
      "- Prepares deleting one recorded match; deletes nothing. The admin confirms in the chat and can undo.",
      '- "undo" right after saving a match means delete that latest match.',
    ].join("\n"),
    schema: z.object({ match: matchRef }),
  },
);
