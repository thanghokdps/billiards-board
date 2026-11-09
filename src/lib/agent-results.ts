/**
 * What the agent's tools return. The model reads these as JSON, and the chat cards render the same JSON
 * (TOOL_CALL_RESULT content), so this file is the one contract between the tools and the cards.
 */
import type { MatchInput, MatchPatch, MatchView, PlayerRef } from "@/server/matches/schema";
import type { SubmissionView } from "@/server/submissions/schema";

import type { GameType, PairingFormat, Period, Side } from "./domain";

/** The one agent id: the runtime's agents map, the emitter and the client `agentId` all use it. */
export const AGENT_ID = "assistant";

export const TOOL_NAMES = {
  listMatches: "list_matches",
  proposeMatches: "propose_matches",
  proposeUpdate: "propose_update",
  proposeDelete: "propose_delete",
  listSubmissions: "list_submissions",
  proposeSubmissionDecision: "propose_submission_decision",
  resolveCard: "resolve_card",
  queryStats: "query_stats",
  headToHead: "head_to_head",
  spinWheel: "spin_wheel",
  generatePoster: "generate_poster",
  trashTalk: "trash_talk",
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/** `RunAgentInput.context` entry: the comma-joined ids of the confirm cards the admin has not decided yet. */
export const OPEN_CARDS_CONTEXT = "Confirm cards still open";
/** `RunAgentInput.context` entry: this page load's id, echoed in `CardDecision.pageId`. */
export const CHAT_PAGE_CONTEXT = "Chat page id";

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

/** `supersedes`: the cards open when this turn began. This card closes them, so a stale one can no longer be saved. */
export interface CreateProposal {
  status: "proposal";
  kind: "create";
  date: string;
  matches: ProposedMatch[];
  supersedes: string[];
}

export interface UpdateProposal {
  status: "proposal";
  kind: "update";
  matchId: string;
  before: MatchView;
  after: MatchView;
  patch: MatchPatch;
  supersedes: string[];
}

export interface DeleteProposal {
  status: "proposal";
  kind: "delete";
  match: MatchView;
  supersedes: string[];
}

/** What a submission card shows. No note and no IP: the card and the model's context hold only what approving needs. */
export type SubmissionCardData = Pick<
  SubmissionView,
  | "gameType"
  | "format"
  | "sideA"
  | "sideB"
  | "winnerSide"
  | "scoreA"
  | "scoreB"
  | "scores"
  | "bill"
  | "date"
  | "submitter"
>;

/** Approve or reject one pending submission; `submissionId` is resolved on the server, never taken from the model. */
export interface SubmissionProposal {
  status: "proposal";
  kind: "submission";
  decision: "approve" | "reject";
  submissionId: string;
  submission: SubmissionCardData;
  supersedes: string[];
}

export type Proposal = CreateProposal | UpdateProposal | DeleteProposal | SubmissionProposal;

/**
 * The admin answered an open card in chat: the card acts on it as if its button was tapped.
 * `pageId`: only the page load that sent the message acts; a reload replays this result and must not write again.
 */
export interface CardDecision {
  status: "card_decision";
  cardIds: string[];
  decision: "confirm" | "cancel";
  pageId: string;
}

/** An instruction for the model only; the chat shows nothing. */
export interface CardNotice {
  status: "card_notice";
  message: string;
}

export interface MatchList {
  status: "ok";
  matches: (MatchView & { time: string; label: string })[];
}

/** Pending submissions, oldest first so a new one never renumbers the others; `label` is the #n the admin and the model use. */
export interface SubmissionList {
  status: "ok";
  total: number;
  submissions: {
    label: string;
    title: string;
    gameType: SubmissionView["gameType"];
    score: string | null;
    bill: number | null;
    submitter: string | null;
    newGuests: string[];
    ageMinutes: number;
  }[];
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
  | CardDecision
  | CardNotice
  | MatchList
  | SubmissionList
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
