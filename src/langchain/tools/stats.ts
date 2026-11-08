import "server-only";

import { tool } from "langchain";
import { z } from "zod";

import {
  TOOL_NAMES,
  type HeadToHeadResult,
  type StatsMetric,
  type StatsResult,
  type TrashTalkFacts,
} from "@/lib/agent-results";
import { GAME_LABEL, GAME_TYPES, periodStart, type GameType, type Period } from "@/lib/domain";
import {
  computeElo,
  computePlayerStats,
  headToHead,
  nemesisAndPrey,
  type PlayerStats,
  type StatMatch,
} from "@/lib/stats";

import { guestHasNoStats, json, loadBoard, requireContext, resolveNames, todayIn } from "./shared";

const METRICS = [
  "paid",
  "win_rate",
  "wins",
  "losses",
  "played",
  "elo",
  "current_streak",
  "longest_win_streak",
  "avg_points",
  "bill_by_game_type",
] as const satisfies readonly StatsMetric[];

const PERIODS = ["today", "week", "month", "year", "all"] as const;

function inPeriod(matches: StatMatch[], period: Period | "today", today: string, gameType: GameType | null) {
  const from = period === "today" ? today : periodStart(period, today);
  return matches.filter((m) => (!from || m.date >= from) && (!gameType || m.gameType === gameType));
}

const UNIT: Record<StatsMetric, StatsResult["unit"]> = {
  paid: "vnd",
  win_rate: "percent",
  wins: "count",
  losses: "count",
  played: "count",
  elo: "elo",
  current_streak: "streak",
  longest_win_streak: "streak",
  avg_points: "points",
  bill_by_game_type: "vnd",
};

function valueOf(metric: StatsMetric, s: PlayerStats): number {
  switch (metric) {
    case "paid":
      return s.paid;
    case "win_rate":
      return Math.round(s.winRate * 100);
    case "wins":
      return s.wins;
    case "losses":
      return s.losses;
    case "played":
      return s.played;
    case "elo":
      return s.elo;
    case "current_streak":
      return s.current ? (s.current.result === "W" ? s.current.length : -s.current.length) : 0;
    case "longest_win_streak":
      return s.longestWinStreak;
    case "avg_points":
      return s.avgPoints ?? 0;
    default:
      return 0;
  }
}

const GAME_COLOR: Record<GameType, string> = { "3c_real": "#1F6B4A", "3c_fake": "#2F7DE1", libre: "#F5C451" };

export const queryStatsTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const { roster, players, matches } = await loadBoard();
    const today = todayIn(context);
    const scoped = inPeriod(matches, input.period, today, input.gameType);
    let rows: StatsResult["rows"];
    if (input.metric === "bill_by_game_type") {
      rows = GAME_TYPES.map((g) => {
        const list = scoped.filter((m) => m.gameType === g && m.bill);
        const total = list.reduce((s, m) => s + (m.bill ?? 0), 0);
        return {
          label: GAME_LABEL[g],
          color: GAME_COLOR[g],
          value: total,
          detail: `${list.length} matches, avg ${list.length ? Math.round(total / list.length) : 0}`,
        };
      });
    } else {
      // Elo is computed over all matches of the scope's game type, not just the period.
      const eloRatings =
        input.metric === "elo"
          ? computeElo(input.gameType ? matches.filter((m) => m.gameType === input.gameType) : matches).ratings
          : null;
      let subset = players;
      if (input.players?.length) {
        const resolved = resolveNames(input.players, roster);
        if (!resolved.ok) return json(resolved.problem);
        const guest = guestHasNoStats(resolved.refs);
        if (guest) return json(guest);
        subset = players.filter((p) => resolved.ids.includes(p.id));
      }
      rows = computePlayerStats(subset, scoped)
        .map((s) => ({
          label: s.player.name,
          color: s.player.ballColor,
          player: s.player,
          value: eloRatings ? Math.round(eloRatings.get(s.player.id) ?? 1200) : valueOf(input.metric, s),
          detail: `${s.wins}W-${s.losses}L`,
        }))
        .sort((a, b) => b.value - a.value);
    }
    const result: StatsResult = {
      status: "ok",
      metric: input.metric,
      period: input.period,
      gameType: input.gameType,
      unit: UNIT[input.metric],
      rows,
      matchCount: scoped.length,
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.queryStats,
    description: [
      "- Answers a stats question with numbers per player (or per game type for bill_by_game_type); the chat draws a bar chart from it.",
      "- paid = bill share paid for losses (loser side pays the whole bill, split per head). current_streak: + wins, − losses.",
      "- Use for rankings, money, win rates, streaks, Elo. One metric per call.",
    ].join("\n"),
    schema: z.object({
      metric: z.enum(METRICS),
      period: z.enum(PERIODS).describe("today, this week, this month, this year, or all time"),
      gameType: z.enum(GAME_TYPES).nullable(),
      players: z.array(z.string()).max(5).nullable().describe("only these players; null = everyone"),
    }),
  },
);

export const headToHeadTool = tool(
  async (input, runtime) => {
    requireContext(runtime);
    const { roster, matches } = await loadBoard();
    const resolved = resolveNames([input.playerA, input.playerB], roster);
    if (!resolved.ok) return json(resolved.problem);
    const [a, b] = resolved.refs as [HeadToHeadResult["a"], HeadToHeadResult["b"]];
    const scoped = input.gameType ? matches.filter((m) => m.gameType === input.gameType) : matches;
    const h = headToHead(a, b, scoped);
    const recent = scoped
      .filter((m) => h.recent.some((r) => r.id === m.id))
      .reverse()
      .slice(0, 5);
    const result: HeadToHeadResult = {
      status: "ok",
      a,
      b,
      gameType: input.gameType,
      aWins: h.aWins,
      bWins: h.bWins,
      played: h.played,
      recent,
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.headToHead,
    description:
      "- Head-to-head record of two players (every match on opposite sides, 1v1 and 2v2), with the last 5 meetings. The chat shows a versus card.",
    schema: z.object({
      playerA: z.string().min(1),
      playerB: z.string().min(1),
      gameType: z.enum(GAME_TYPES).nullable(),
    }),
  },
);

const formOf = (s: PlayerStats) => s.form.join(" ") || "-";

export const trashTalkTool = tool(
  async (input, runtime) => {
    const context = requireContext(runtime);
    const { roster, players, matches } = await loadBoard();
    const resolved = resolveNames([input.player], roster);
    if (!resolved.ok) return json(resolved.problem);
    const guest = guestHasNoStats(resolved.refs);
    if (guest) return json(guest);
    const player = resolved.refs[0]!;
    const all = computePlayerStats(players, matches).find((s) => s.player.id === player.id)!;
    const month = computePlayerStats(players, inPeriod(matches, "month", todayIn(context), null)).find(
      (s) => s.player.id === player.id,
    )!;
    const rivals = nemesisAndPrey(player, players, matches);
    const catchphrase = roster.find((p) => p.id === player.id)?.catchphrase ?? null;
    const result: TrashTalkFacts = {
      status: "ok",
      player,
      facts: {
        form_last_10_newest_first: formOf(all),
        current_streak: all.current ? `${all.current.length}${all.current.result}` : null,
        win_rate_all_time_pct: Math.round(all.winRate * 100),
        record_all_time: `${all.wins}W-${all.losses}L`,
        paid_this_month_vnd: month.paid,
        paid_all_time_vnd: all.paid,
        nemesis: rivals.nemesis ? `${rivals.nemesis.player.name} (${rivals.nemesis.losses} losses)` : null,
        weakest_game: all.weakest,
        biggest_collector_of_their_money: all.topCollector?.player.name ?? null,
        catchphrase,
      },
    };
    return json(result);
  },
  {
    name: TOOL_NAMES.trashTalk,
    description: [
      "- Real stats about one player to roast them with (form, streak, money paid, nemesis, weakest game, catchphrase).",
      "- Write one or two playful lines from these facts only, in the user's language; never invent numbers.",
    ].join("\n"),
    schema: z.object({ player: z.string().min(1) }),
  },
);
