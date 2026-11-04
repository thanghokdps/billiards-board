/**
 * What the agent's tools return. The model reads these as JSON, and the chat cards render the same JSON
 * (TOOL_CALL_RESULT content), so this file is the one contract between the tools and the cards.
 */
import type { MatchInput, MatchPatch, MatchView, PlayerRef } from "@/server/matches/schema";

import type { GameType, PairingFormat, Period, Side } from "./domain";

/** The one agent id: the runtime's agents map, the emitter and the client `agentId` all use it. */
export const AGENT_ID = "assistant";

export const TOOL_NAMES = {
  listMatches: "list_matches",
  proposeMatches: "propose_matches",
  proposeUpdate: "propose_update",
  proposeDelete: "propose_delete",
  queryStats: "query_stats",
  headToHead: "head_to_head",
  spinWheel: "spin_wheel",
  generatePoster: "generate_poster",
  trashTalk: "trash_talk",
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/** Something the model must ask the user, in exactly one question (chips when options exist). */
export interface NeedsInput {
  status: "needs_input";
  question: "game_type" | "players" | "winner" | "loser" | "guest_loser" | "match" | "player";
  options?: { label: string; value: string }[];
  hint?: string;
}

export interface NameProblem {
  status: "ambiguous_player" | "unknown_player";
  name: string;
  candidates: PlayerRef[];
}

export interface ToolFailure {
  status: "error";
  message: string;
}

export interface ProposedMatch {
  input: MatchInput;
  sideA: PlayerRef[];
  sideB: PlayerRef[];
}

export interface CreateProposal {
  status: "proposal";
  kind: "create";
  date: string;
  matches: ProposedMatch[];
}

export interface UpdateProposal {
  status: "proposal";
  kind: "update";
  matchId: string;
  before: MatchView;
  after: MatchView;
  patch: MatchPatch;
}

export interface DeleteProposal {
  status: "proposal";
  kind: "delete";
  match: MatchView;
}

export type Proposal = CreateProposal | UpdateProposal | DeleteProposal;

export interface MatchList {
  status: "ok";
  matches: (MatchView & { time: string; label: string })[];
}

export type StatsMetric =
  | "paid"
  | "win_rate"
  | "wins"
  | "losses"
  | "played"
  | "elo"
  | "current_streak"
  | "longest_win_streak"
  | "avg_points"
  | "bill_by_game_type";

export interface StatsResult {
  status: "ok";
  metric: StatsMetric;
  period: Period | "today";
  gameType: GameType | null;
  unit: "vnd" | "percent" | "count" | "points" | "elo" | "streak";
  rows: { label: string; color: string; value: number; player?: PlayerRef; detail?: string }[];
  matchCount: number;
}

export interface HeadToHeadResult {
  status: "ok";
  a: PlayerRef;
  b: PlayerRef;
  gameType: GameType | null;
  aWins: number;
  bWins: number;
  played: number;
  recent: MatchView[];
}

export interface WheelSetup {
  status: "ok";
  mode: PairingFormat;
  participants: { player: PlayerRef; weight: number }[];
  target: PlayerRef | null;
  multiplier: number | null;
}

export interface PosterResult {
  status: "ok";
  kind: "match" | "wanted" | "rivalry";
  url: string;
  title: string;
}

export interface TrashTalkFacts {
  status: "ok";
  player: PlayerRef;
  facts: Record<string, string | number | null>;
}

export type AnyToolResult =
  | NeedsInput
  | NameProblem
  | ToolFailure
  | Proposal
  | MatchList
  | StatsResult
  | HeadToHeadResult
  | WheelSetup
  | PosterResult
  | TrashTalkFacts;

export type { Side };

/** Parses a TOOL_CALL_RESULT content string; anything unexpected becomes a failure the card can show. */
export function parseToolResult(content: string | undefined): AnyToolResult | null {
  if (!content) return null;
  try {
    const value: unknown = JSON.parse(content);
    if (value && typeof value === "object" && "status" in value) return value as AnyToolResult;
    return null;
  } catch {
    return { status: "error", message: content.slice(0, 200) };
  }
}
