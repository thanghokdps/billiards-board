import { z } from "zod";

import { GAME_TYPES } from "@/lib/domain";

const playerId = z.number().int().positive();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const matchInputSchema = z
  .object({
    gameType: z.enum(GAME_TYPES),
    format: z.enum(["1v1", "2v2"]),
    sideA: z.array(playerId).min(1).max(2),
    sideB: z.array(playerId).min(1).max(2),
    winnerSide: z.enum(["a", "b"]),
    scoreA: z.number().int().min(0).max(999).nullable().optional(),
    scoreB: z.number().int().min(0).max(999).nullable().optional(),
    bill: z.number().int().min(0).max(10_000_000).nullable().optional(),
    note: z.string().trim().max(280).nullable().optional(),
    tags: z.array(z.string().trim().min(2).max(40)).max(6).optional(),
    /** Local session date; defaults to today in the app time zone. */
    date: dateStr.optional(),
  })
  .superRefine((m, ctx) => {
    const size = m.format === "1v1" ? 1 : 2;
    if (m.sideA.length !== size || m.sideB.length !== size) {
      ctx.addIssue({
        code: "custom",
        path: ["format"],
        message: `a ${m.format} match needs ${size} player(s) per side`,
      });
    }
    if (new Set([...m.sideA, ...m.sideB]).size !== m.sideA.length + m.sideB.length) {
      ctx.addIssue({ code: "custom", path: ["sideB"], message: "a player cannot be on both sides or twice" });
    }
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
  format: z.enum(["1v1", "2v2"]).optional(),
  sideA: z.array(playerId).min(1).max(2).optional(),
  sideB: z.array(playerId).min(1).max(2).optional(),
  winnerSide: z.enum(["a", "b"]).optional(),
  scoreA: z.number().int().min(0).max(999).nullable().optional(),
  scoreB: z.number().int().min(0).max(999).nullable().optional(),
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
  format: "1v1" | "2v2";
  sideA: PlayerRef[];
  sideB: PlayerRef[];
  winnerSide: "a" | "b";
  scoreA: number | null;
  scoreB: number | null;
  bill: number | null;
  note: string | null;
  tags: string[];
  deleted: boolean;
}
