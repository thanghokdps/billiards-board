import "server-only";

import { tool } from "langchain";
import { z } from "zod";

import { TOOL_NAMES, type PosterResult, type WheelSetup } from "@/lib/agent-results";
import { matchTitle, PAIRING_FORMATS, PLAYERS_IN_FORMAT } from "@/lib/domain";
import { computePlayerStats, wanted } from "@/lib/stats";
import { toPlayerRef } from "@/server/players/repository";
import { getSessionByDate } from "@/server/sessions/repository";

import { findTargetMatch, json, loadBoard, requireContext, resolveNames, todayIn } from "./shared";

export const spinWheelTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const { roster } = await loadBoard();
    let pool = roster;
    if (input.include?.length) {
      const resolved = resolveNames(input.include, roster);
      if (!resolved.ok) return json(resolved.problem);
      pool = roster.filter((p) => resolved.ids.includes(p.id));
    } else {
      const session = await getSessionByDate(todayIn(context));
      if (session && session.attendees.length >= 2) pool = roster.filter((p) => session.attendees.includes(p.id));
    }
    if (input.exclude?.length) {
      const resolved = resolveNames(input.exclude, roster);
      if (!resolved.ok) return json(resolved.problem);
      pool = pool.filter((p) => !resolved.ids.includes(p.id));
    }
    const needed = PLAYERS_IN_FORMAT[input.mode];
    if (pool.length < needed)
      return json({ status: "error", message: `Need at least ${needed} players for ${input.mode}.` });
    let target = null;
    if (input.target) {
      const resolved = resolveNames([input.target], pool);
      if (!resolved.ok) return json(resolved.problem);
      target = resolved.refs[0]!;
    }
    const multiplier = target ? (input.multiplier ?? 2) : null;
    // "xN": everyone else weighs N times the target, so the target's slice shrinks.
    const result: WheelSetup = {
      status: "ok",
      mode: input.mode,
      participants: pool.map((p) => ({
        player: toPlayerRef(p),
        weight: target && p.id !== target.id ? multiplier! : 1,
      })),
      target,
      multiplier,
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.spinWheel,
    description: [
      "- Sets up the random wheel in the chat to pick a 1v1, 2v2 or 1v1v1 pairing; the browser spins it (fair random), nothing is saved.",
      '- "bỏ Lâm" → exclude. "Bổ x5" → target Bổ, multiplier 5 (everyone else weighs 5× Bổ). Default players: today\'s attendees.',
    ].join("\n"),
    schema: z.object({
      mode: z.enum(PAIRING_FORMATS),
      include: z
        .array(z.string())
        .max(8)
        .nullable()
        .describe("only these players; null = today's attendees or everyone"),
      exclude: z.array(z.string()).max(8).nullable(),
      target: z.string().nullable().describe("the 'victim' whose slice shrinks"),
      multiplier: z.union([z.literal(2), z.literal(3), z.literal(5), z.literal(6)]).nullable(),
    }),
  },
);

export const generatePosterTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const locale = context.locale;
    if (input.kind === "rivalry") {
      return json({
        status: "ok",
        kind: "rivalry",
        url: `/api/poster/rivalry?locale=${locale}`,
        title: "Rivalry",
      } satisfies PosterResult);
    }
    if (input.kind === "wanted") {
      const { roster, players, matches } = await loadBoard();
      let slug: string | undefined;
      if (input.player) {
        const resolved = resolveNames([input.player], roster);
        if (!resolved.ok) return json(resolved.problem);
        slug = resolved.refs[0]!.slug;
      } else {
        slug = wanted(computePlayerStats(players, matches), [], players)[0]?.player.slug;
      }
      if (!slug) return json({ status: "error", message: "Nobody is on a 5-loss streak right now; name a player." });
      return json({
        status: "ok",
        kind: "wanted",
        url: `/api/poster/wanted/${slug}?locale=${locale}`,
        title: "WANTED",
      } satisfies PosterResult);
    }
    const match = await findTargetMatch(input.match ?? "latest");
    if ("status" in match) return json(match);
    const title = matchTitle(match);
    return json({
      status: "ok",
      kind: "match",
      url: `/api/poster/match/${match.id}?locale=${locale}`,
      title,
    } satisfies PosterResult);
  },
  {
    name: TOOL_NAMES.generatePoster,
    description: [
      "- Makes a fight-night poster image from real data: a match (default the latest), a WANTED poster for a player on a losing streak, or the rivalry poster.",
      "- The chat shows the image with download and copy buttons.",
    ].join("\n"),
    schema: z.object({
      kind: z.enum(["match", "wanted", "rivalry"]),
      match: z.string().nullable().describe('"latest" or a match id; only for kind=match'),
      player: z.string().nullable().describe("only for kind=wanted"),
    }),
  },
);
