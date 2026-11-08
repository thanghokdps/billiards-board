import "server-only";

import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";

import type { Player } from "@/db/schema";
import { TOOL_NAMES, type CardNotice, type NameProblem, type NeedsInput, type ToolFailure } from "@/lib/agent-results";
import { localDate, type GameType } from "@/lib/domain";
import { resolvePlayerName } from "@/lib/names";
import { findMatches, findMatchById } from "@/server/matches/repository";
import type { MatchView, PlayerRef } from "@/server/matches/schema";
import { listPlayers, toPlayerRef } from "@/server/players/repository";

import { readTrustedContext, type AgentContext } from "../context";

const PROPOSE_TOOLS = new Set<string>([TOOL_NAMES.proposeMatches, TOOL_NAMES.proposeUpdate, TOOL_NAMES.proposeDelete]);

export const GAME_TYPE_OPTIONS: NeedsInput["options"] = [
  { label: "3C Real", value: "3c_real" },
  { label: "3C Fake", value: "3c_fake" },
  { label: "Libre", value: "libre" },
];

export const json = (value: unknown) => JSON.stringify(value);

/** The trusted context, or a refusal: tools never run for an unverified caller. */
export function requireContext(runtime: { context?: unknown }): AgentContext {
  const context = readTrustedContext(runtime.context);
  if (!context) throw new Error("no trusted caller");
  return context;
}

/**
 * A confirm writes, so a turn gets one, and none beside a proposal: "bill 60k, lưu đi" would otherwise save
 * the card that proposal replaces. Tools of one model step run in parallel, so the check reads the calls.
 */
export function confirmBlockedThisTurn(messages: BaseMessage[]): boolean {
  const turn = messages.slice(messages.findLastIndex((m) => HumanMessage.isInstance(m)) + 1);
  const calls = turn.flatMap((m) => (AIMessage.isInstance(m) ? (m.tool_calls ?? []) : [])).map((c) => c.name);
  return calls.some((name) => PROPOSE_TOOLS.has(name)) || calls.filter((n) => n === TOOL_NAMES.resolveCard).length > 1;
}

export const todayIn = (context: AgentContext) => localDate(new Date(), context.timeZone);

/** `roster` (guests included) resolves names; `players` (members only) is what stats and rankings are computed over. */
export async function loadBoard() {
  const [roster, matches] = await Promise.all([listPlayers(), findMatches({})]);
  return { roster, players: roster.filter((p) => !p.guest).map(toPlayerRef), matches };
}

/** Guests have no stats, Elo or profile; a stats tool asked about one tells the model to say so. */
export function guestHasNoStats(refs: PlayerRef[]): ToolFailure | null {
  const guest = refs.find((r) => r.guest);
  return guest
    ? {
        status: "error",
        message: `${guest.name} is a guest: guests have no stats, Elo or profile. Tell the admin that in one short line; do not call another tool for it.`,
      }
    : null;
}

export type Resolved = { ok: true; ids: number[]; refs: PlayerRef[] } | { ok: false; problem: NameProblem };

/** Resolves every name or returns the first problem (ambiguous or unknown), which the model asks about. */
export function resolveNames(names: string[], roster: Player[]): Resolved {
  const refs: PlayerRef[] = [];
  for (const name of names) {
    const result = resolvePlayerName(name, roster);
    if (result.status === "found") {
      refs.push(toPlayerRef(result.player));
      continue;
    }
    return {
      ok: false,
      problem: {
        status: result.status === "ambiguous" ? "ambiguous_player" : "unknown_player",
        name,
        candidates: (result.status === "ambiguous" ? result.candidates : roster).map(toPlayerRef),
      },
    };
  }
  return { ok: true, ids: refs.map((r) => r.id), refs };
}

export const supersededCards = (context: AgentContext) => context.openCards.map((c) => c.id);

/** "latest" means the newest saved match, so with an unsaved create card open it would change the wrong row. */
export function latestHidesOpenCard(ref: string, context: AgentContext): CardNotice | null {
  if (ref !== "latest" || !context.openCards.some((c) => c.kind === "create")) return null;
  return {
    status: "card_notice",
    message:
      'Not done yet, and do not ask the admin anything. "latest" is a saved match; the admin means the unsaved open "create" card. Call propose_matches now yourself, with every match of that card from CONTEXT and the change applied. Only if the admin named an older saved match, call this tool again with its id.',
  };
}

/** "latest" or a match id → the match, or a failure the model can relay. */
export async function findTargetMatch(ref: string): Promise<MatchView | ToolFailure> {
  if (ref === "latest") {
    const [latest] = await findMatches({ order: "desc", limit: 1 });
    return latest ?? { status: "error", message: "No match recorded yet." };
  }
  const match = await findMatchById(ref);
  if (!match || match.deleted) return { status: "error", message: "No such match. Call list_matches to find its id." };
  return match;
}

export const isGameType = (v: unknown): v is GameType => v === "3c_real" || v === "3c_fake" || v === "libre";
