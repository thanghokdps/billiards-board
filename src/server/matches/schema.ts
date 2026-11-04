import { z } from "zod";

import { formatOfSides, GAME_TYPES, MATCH_FORMATS } from "@/lib/domain";

const playerId = z.number().int().positive();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");
const playerScores = z
  .array(z.object({ playerId, score: z.number().int().min(0).max(999) }))
  .max(3)
  .optional();

type PlayerScores = NonNullable<z.infer<typeof playerScores>>;

/** The rules only a 1v1v1 has; see `formatOfSides` for how it is stored. */
function threeWayProblems(m: {
  sideA: number[];
  sideB: number[];
  winnerSide: "a" | "b";
  scoreA?: number | null;
  scoreB?: number | null;
  scores?: PlayerScores;
}): { path: string; message: string }[] {
  const problems: { path: string; message: string }[] = [];
  if (m.winnerSide !== "a") problems.push({ path: "winnerSide", message: "in a 1v1v1 side A holds the two winners" });
  if (m.scoreA != null || m.scoreB != null)
    problems.push({ path: "scores", message: "a 1v1v1 keeps its score per player, in scores" });
  const scores = m.scores ?? [];
  if (scores.length === 0) return problems;
  const seated = new Set([...m.sideA, ...m.sideB]);
  if (new Set(scores.map((s) => s.playerId)).size !== 3 || !scores.every((s) => seated.has(s.playerId))) {
    problems.push({ path: "scores", message: "a 1v1v1 score needs all three players, or none" });
    return problems;
  }
  const scoreOf = (id: number) => scores.find((s) => s.playerId === id)?.score ?? 0;
  const loserScore = scoreOf(m.sideB[0] ?? 0);
  if (m.sideA.some((id) => scoreOf(id) <= loserScore))
    problems.push({ path: "scores", message: "the loser must have the lowest score, alone" });
  return problems;
}

export const matchInputSchema = z
  .object({
    gameType: z.enum(GAME_TYPES),
    format: z.enum(MATCH_FORMATS),
    sideA: z.array(playerId).min(1).max(2),
    /** Empty only in a guest match; `formatOfSides` below enforces it. */
    sideB: z.array(playerId).max(2),
    winnerSide: z.enum(["a", "b"]),
    scoreA: z.number().int().min(0).max(999).nullable().optional(),
    scoreB: z.number().int().min(0).max(999).nullable().optional(),
    scores: playerScores,
    bill: z.number().int().min(0).max(10_000_000).nullable().optional(),
    note: z.string().trim().max(280).nullable().optional(),
    tags: z.array(z.string().trim().min(2).max(40)).max(6).optional(),
    /** Local session date; defaults to today in the app time zone. */
    date: dateStr.optional(),
  })
  .superRefine((m, ctx) => {
    if (formatOfSides(m.sideA.length, m.sideB.length) !== m.format) {
      ctx.addIssue({
        code: "custom",
        path: ["format"],
        message: `${m.sideA.length} and ${m.sideB.length} player(s) per side is not a ${m.format} match`,
      });
    }
    if (new Set([...m.sideA, ...m.sideB]).size !== m.sideA.length + m.sideB.length) {
      ctx.addIssue({ code: "custom", path: ["sideB"], message: "a player cannot be on both sides or twice" });
    }
    if (m.format === "1v1v1") {
      for (const { path, message } of threeWayProblems(m)) ctx.addIssue({ code: "custom", path: [path], message });
      return;
    }
    if (m.format === "guest") {
      if (m.scoreA != null || m.scoreB != null || m.scores?.length || m.bill != null)
        ctx.addIssue({ code: "custom", path: ["format"], message: "a guest match keeps no score and no bill" });
      return;
    }
    if (m.scores?.length) ctx.addIssue({ code: "custom", path: ["scores"], message: "only a 1v1v1 uses scores" });
    if (m.scoreA != null && m.scoreB != null) {
      const winner = m.winnerSide === "a" ? m.scoreA : m.scoreB;
      const loser = m.winnerSide === "a" ? m.scoreB : m.scoreA;
      if (winner <= loser)
        ctx.addIssue({
          code: "custom",
          path: ["winnerSide"],
          message: "the winner must have the higher score (no draws)",
        });
    }
  });

export type MatchInput = z.infer<typeof matchInputSchema>;

export const createMatchesBodySchema = z.object({
  matches: z.array(matchInputSchema).min(1).max(10),
  via: z.enum(["chat", "ui"]).default("ui"),
  /** Same key again → the matches it created are returned, nothing new is written. */
  idempotencyKey: z
    .string()
    .regex(/^[\w-]{8,80}$/)
    .optional(),
});

export const matchPatchSchema = z.object({
  gameType: z.enum(GAME_TYPES).optional(),
  format: z.enum(MATCH_FORMATS).optional(),
  sideA: z.array(playerId).min(1).max(2).optional(),
  sideB: z.array(playerId).max(2).optional(),
  winnerSide: z.enum(["a", "b"]).optional(),
  scoreA: z.number().int().min(0).max(999).nullable().optional(),
  scoreB: z.number().int().min(0).max(999).nullable().optional(),
  scores: playerScores,
  bill: z.number().int().min(0).max(10_000_000).nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
  tags: z.array(z.string().trim().min(2).max(40)).max(6).optional(),
});

export type MatchPatch = z.infer<typeof matchPatchSchema>;

export const updateMatchBodySchema = z.object({ patch: matchPatchSchema, via: z.enum(["chat", "ui"]).default("ui") });

export interface PlayerRef {
  id: number;
  slug: string;
  name: string;
  nickname: string | null;
  ballColor: string;
  ballNumber: number;
  avatarUrl: string | null;
}

/** The DTO every API and the UI use for one match. */
export interface MatchView {
  id: string;
  date: string;
  playedAt: string;
  gameType: (typeof GAME_TYPES)[number];
  format: (typeof MATCH_FORMATS)[number];
  sideA: PlayerRef[];
  sideB: PlayerRef[];
  winnerSide: "a" | "b";
  scoreA: number | null;
  scoreB: number | null;
  scores: PlayerScores;
  bill: number | null;
  note: string | null;
  tags: string[];
  deleted: boolean;
}
