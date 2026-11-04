import "server-only";

import type { Player } from "@/db/schema";
import type { NameProblem, NeedsInput, ToolFailure } from "@/lib/agent-results";
import { localDate, type GameType } from "@/lib/domain";
import { resolvePlayerName } from "@/lib/names";
import { findMatches, findMatchById } from "@/server/matches/repository";
import type { MatchView, PlayerRef } from "@/server/matches/schema";
import { listPlayers, toPlayerRef } from "@/server/players/repository";

import { readTrustedContext, type AgentContext } from "../context";

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

export const todayIn = (context: AgentContext) => localDate(new Date(), context.timeZone);

export async function loadBoard() {
  const [roster, matches] = await Promise.all([listPlayers(), findMatches({})]);
  return { roster, players: roster.map(toPlayerRef), matches };
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
