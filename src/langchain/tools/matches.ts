import "server-only";

import { tool } from "langchain";
import { z } from "zod";

import {
  TOOL_NAMES,
  type CardDecision,
  type CardNotice,
  type CreateProposal,
  type DeleteProposal,
  type MatchList,
  type NeedsInput,
  type ProposedMatch,
  type UpdateProposal,
} from "@/lib/agent-results";
import { formatTime, GAME_TYPES, MATCH_TAGS } from "@/lib/domain";
import { findMatches } from "@/server/matches/repository";
import { matchInputSchema, type MatchPatch, type MatchView } from "@/server/matches/schema";
import { listPlayers } from "@/server/players/repository";

import {
  findTargetMatch,
  GAME_TYPE_OPTIONS,
  json,
  latestHidesOpenCard,
  requireContext,
  resolveNames,
  supersededCards,
  todayIn,
} from "./shared";

const names = z.array(z.string().min(1).max(40)).min(1).max(2);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const matchRef = z
  .string()
  .describe('"latest" for the most recent match ("trận vừa rồi"), or a match id from list_matches');

const draftSchema = z.object({
  gameType: z.enum(GAME_TYPES).nullable().describe("null when the user did not say it; never guess"),
  sideA: names.describe("player names exactly as the user wrote them"),
  sideB: names,
  winnerSide: z.enum(["a", "b"]).nullable().describe("null when the user did not say who won"),
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

// Models often leave out what the user did not mention; an omitted field means the same as null.
const draftsSchema = draftSchema.partial().required({ sideA: true, sideB: true });

function needs(question: NeedsInput["question"], options?: NeedsInput["options"]): NeedsInput {
  return { status: "needs_input", question, ...(options ? { options } : {}) };
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
      const a = resolveNames(draft.sideA, roster);
      if (!a.ok) return json(a.problem);
      const b = resolveNames(draft.sideB, roster);
      if (!b.ok) return json(b.problem);
      if (!draft.winnerSide) {
        return json(
          needs("winner", [
            { label: a.refs.map((p) => p.name).join(" + "), value: "a" },
            { label: b.refs.map((p) => p.name).join(" + "), value: "b" },
          ]),
        );
      }
      const parsed = matchInputSchema.safeParse({
        gameType: draft.gameType,
        format: a.ids.length === 2 ? "2v2" : "1v1",
        sideA: a.ids,
        sideB: b.ids,
        winnerSide: draft.winnerSide,
        scoreA: draft.scoreA,
        scoreB: draft.scoreB,
        bill: draft.bill,
        note: draft.note,
        tags: (draft.tags ?? []).filter((t) => (MATCH_TAGS as readonly string[]).includes(t)),
        date: draft.date ?? today,
      });
      if (!parsed.success)
        return json({ status: "error", message: parsed.error.issues.map((i) => i.message).join("; ") });
      proposed.push({ input: parsed.data, sideA: a.refs, sideB: b.refs });
    }
    const result: CreateProposal = {
      status: "proposal",
      kind: "create",
      date: today,
      matches: proposed,
      supersedes: supersededCards(context),
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.proposeMatches,
    description: [
      "- Prepares one or more finished matches for the admin to confirm; it saves nothing.",
      "- Returns a proposal (the chat shows a confirm card with Save) or what is missing / which name is unclear.",
      "- One entry per match, in the order the user listed them. 1v1 = one name per side, 2v2 = two.",
      "- Also how to correct a match on an open card: send every match of the card again, corrected.",
    ].join("\n"),
    schema: z.object({ matches: z.array(draftsSchema).min(1).max(10) }),
  },
);

const patchSchema = z
  .object({
    gameType: z.enum(GAME_TYPES).nullable(),
    sideA: names.nullable(),
    sideB: names.nullable(),
    winnerSide: z.enum(["a", "b"]).nullable(),
    scoreA: z.number().int().min(0).max(999).nullable(),
    scoreB: z.number().int().min(0).max(999).nullable(),
    bill: z.number().int().min(0).max(10_000_000).nullable().describe('VND; "45k" = 45000'),
    note: z.string().max(280).nullable(),
    tags: z.array(z.string()).max(6).nullable(),
  })
  .partial();

/** Merges the requested change onto the match for the before → after preview. */
function preview(
  before: MatchView,
  patch: MatchPatch,
  refs: { a?: MatchView["sideA"]; b?: MatchView["sideB"] },
): MatchView {
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
    const context = requireContext(runtime);
    const notice = latestHidesOpenCard(input.match, context);
    if (notice) return json(notice);
    const target = await findTargetMatch(input.match);
    if ("status" in target) return json(target);
    const roster = await listPlayers();
    const changes = input.changes;
    const patch: MatchPatch = {};
    const refs: { a?: MatchView["sideA"]; b?: MatchView["sideB"] } = {};
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
    if (patch.sideA || patch.sideB) patch.format = (patch.sideA ?? patch.sideB)!.length === 2 ? "2v2" : "1v1";
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
      supersedes: supersededCards(context),
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.proposeUpdate,
    description: [
      "- Prepares a change to one recorded match (score, winner, players, game type, bill, note, tags); saves nothing.",
      '- Also sets a bill: "trận vừa rồi bill 45k" → changes.bill = 45000.',
      "- Returns a before → after proposal the admin confirms in the chat. Only fields the user changes are non-null.",
    ].join("\n"),
    schema: z.object({ match: matchRef, changes: patchSchema }),
  },
);

export const proposeDeleteTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const notice = latestHidesOpenCard(input.match, context);
    if (notice) return json(notice);
    const target = await findTargetMatch(input.match);
    if ("status" in target) return json(target);
    const result: DeleteProposal = {
      status: "proposal",
      kind: "delete",
      match: target,
      supersedes: supersededCards(context),
    };
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

export const resolveCardTool = tool(
  async (input, runtime) => {
    const { openCards, pageId } = requireContext(runtime);
    // Numbers, not toolCallIds: live turns copied stale ids from earlier tool calls in the thread.
    const cards = openCards.length === 1 ? openCards : openCards.filter((_, i) => input.cardNumbers?.includes(i + 1));
    // The model turned a bare "ok" into every card despite the prompt, and a confirm writes, even deletes.
    if (!cards.length || (input.decision === "confirm" && cards.length > 1)) {
      const notice: CardNotice = {
        status: "card_notice",
        message: openCards.length
          ? "Several cards are open: nothing was saved or cancelled. A confirm takes exactly one card, so ask the admin which one. A cancel can take every number in cardNumbers if the admin meant all of them."
          : "No card is open: nothing was saved or cancelled. Tell the admin nothing is pending.",
      };
      return json(notice);
    }
    const result: CardDecision = {
      status: "card_decision",
      cardIds: cards.map((c) => c.id),
      decision: input.decision,
      pageId,
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.resolveCard,
    description: [
      "- Passes the admin's chat answer to open confirm cards, like tapping their buttons. The cards do the write and show the result.",
      "- Use only when the admin's newest message itself confirms or cancels. Not for changing a card: propose it again.",
    ].join("\n"),
    schema: z.object({
      decision: z.enum(["confirm", "cancel"]),
      cardNumbers: z
        .array(z.number().int().min(1))
        .max(20)
        .nullish()
        .describe(
          'when several cards are open: the # from "Open confirm cards"; one for confirm, any number for cancel',
        ),
    }),
  },
);
