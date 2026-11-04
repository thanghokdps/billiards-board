/**
 * Pure statistics over a chronological list of matches. No I/O: the server, the agent and the UI
 * all call these with the same MatchView DTOs, so every number in the app comes from one place.
 */
import type { GameType, MatchFormat } from "./domain";

export interface StatPlayer {
  id: number;
  slug: string;
  name: string;
  nickname: string | null;
  ballColor: string;
  ballNumber: number;
  avatarUrl: string | null;
}

export interface StatMatch {
  id: string;
  date: string;
  playedAt: string;
  gameType: GameType;
  format: MatchFormat;
  sideA: StatPlayer[];
  sideB: StatPlayer[];
  winnerSide: "a" | "b";
  scoreA: number | null;
  scoreB: number | null;
  /** Each player's own score in a 1v1v1; empty otherwise. */
  scores: { playerId: number; score: number }[];
  bill: number | null;
  tags: string[];
}

export type Result = "W" | "L";

export interface PlayerStats {
  player: StatPlayer;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPoints: number | null;
  longestWinStreak: number;
  longestLossStreak: number;
  current: { result: Result; length: number } | null;
  /** Newest first, up to 10. */
  form: Result[];
  /** Bill share paid because of losses (loser side pays the whole bill, split per head). */
  paid: number;
  /** The opponent whose wins cost this player the most. */
  topCollector: { player: StatPlayer; amount: number } | null;
  byGameType: Record<GameType, { played: number; wins: number; winRate: number }>;
  strongest: GameType | null;
  weakest: GameType | null;
  elo: number;
  sessionsAttended: number;
}

export const ELO_START = 1200;
const ELO_K = 24;

const sidesOf = (m: StatMatch) => ({
  winners: m.winnerSide === "a" ? m.sideA : m.sideB,
  losers: m.winnerSide === "a" ? m.sideB : m.sideA,
});

function emptyByType(): PlayerStats["byGameType"] {
  return {
    "3c_real": { played: 0, wins: 0, winRate: 0 },
    "3c_fake": { played: 0, wins: 0, winRate: 0 },
    libre: { played: 0, wins: 0, winRate: 0 },
  };
}

/** What the winner gains from the loser. */
const eloGain = (winnerRating: number, loserRating: number, k: number) =>
  k * (1 - 1 / (1 + 10 ** ((loserRating - winnerRating) / 400)));

/**
 * Elo replayed over the matches in order. 2v2 uses team averages and every member gets the team delta.
 * In a 1v1v1 the loser plays each winner at half K: the sum stays zero and the loser risks what a 1v1 costs.
 * A guest match moves no rating but keeps its history entry: `cardStats` reads history by match index.
 */
export function computeElo(matches: StatMatch[]): {
  ratings: Map<number, number>;
  history: { date: string; matchId: string; ratings: Record<number, number> }[];
} {
  const ratings = new Map<number, number>();
  const get = (id: number) => ratings.get(id) ?? ELO_START;
  const history: { date: string; matchId: string; ratings: Record<number, number> }[] = [];
  for (const m of matches) {
    const { winners, losers } = sidesOf(m);
    if (m.format === "1v1v1") {
      const loser = losers[0]!;
      const loserRating = get(loser.id);
      let lost = 0;
      for (const p of winners) {
        const gain = eloGain(get(p.id), loserRating, ELO_K / 2);
        ratings.set(p.id, get(p.id) + gain);
        lost += gain;
      }
      ratings.set(loser.id, loserRating - lost);
    } else if (m.format !== "guest") {
      const rw = winners.reduce((s, p) => s + get(p.id), 0) / winners.length;
      const rl = losers.reduce((s, p) => s + get(p.id), 0) / losers.length;
      const delta = eloGain(rw, rl, ELO_K);
      for (const p of winners) ratings.set(p.id, get(p.id) + delta);
      for (const p of losers) ratings.set(p.id, get(p.id) - delta);
    }
    history.push({
      date: m.date,
      matchId: m.id,
      ratings: Object.fromEntries([...ratings].map(([k, v]) => [k, Math.round(v)])),
    });
  }
  return { ratings, history };
}

export function computePlayerStats(players: StatPlayer[], matches: StatMatch[]): PlayerStats[] {
  const elo = computeElo(matches).ratings;
  return players.map((player) => {
    const mine = matches.filter((m) => [...m.sideA, ...m.sideB].some((p) => p.id === player.id));
    const results: Result[] = [];
    const byGameType = emptyByType();
    let paid = 0;
    let points = 0;
    let pointMatches = 0;
    const collectors = new Map<number, { player: StatPlayer; amount: number }>();
    for (const m of mine) {
      const onA = m.sideA.some((p) => p.id === player.id);
      const won = (m.winnerSide === "a") === onA;
      results.push(won ? "W" : "L");
      const t = byGameType[m.gameType];
      t.played += 1;
      if (won) t.wins += 1;
      const own = m.scores.find((s) => s.playerId === player.id)?.score ?? (onA ? m.scoreA : m.scoreB);
      if (own != null) {
        points += own;
        pointMatches += 1;
      }
      if (!won && m.bill) {
        const losers = onA ? m.sideA : m.sideB;
        const share = m.bill / losers.length;
        paid += share;
        const winners = onA ? m.sideB : m.sideA;
        for (const w of winners) {
          const c = collectors.get(w.id) ?? { player: w, amount: 0 };
          c.amount += share / winners.length;
          collectors.set(w.id, c);
        }
      }
    }
    for (const t of Object.values(byGameType)) t.winRate = t.played ? t.wins / t.played : 0;

    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let run = 0;
    let prev: Result | null = null;
    for (const r of results) {
      run = r === prev ? run + 1 : 1;
      prev = r;
      if (r === "W") longestWinStreak = Math.max(longestWinStreak, run);
      else longestLossStreak = Math.max(longestLossStreak, run);
    }
    const wins = results.filter((r) => r === "W").length;
    const ranked = (Object.entries(byGameType) as [GameType, { played: number; winRate: number }][]).filter(
      ([, v]) => v.played >= 3,
    );
    ranked.sort((a, b) => b[1].winRate - a[1].winRate);
    const topCollector = [...collectors.values()].sort((a, b) => b.amount - a.amount)[0] ?? null;

    return {
      player,
      played: results.length,
      wins,
      losses: results.length - wins,
      winRate: results.length ? wins / results.length : 0,
      avgPoints: pointMatches ? points / pointMatches : null,
      longestWinStreak,
      longestLossStreak,
      current: prev ? { result: prev, length: run } : null,
      form: results.slice(-10).reverse(),
      paid: Math.round(paid),
      topCollector: topCollector ? { ...topCollector, amount: Math.round(topCollector.amount) } : null,
      byGameType,
      strongest: ranked.length >= 2 ? ranked[0]![0] : null,
      weakest: ranked.length >= 2 ? ranked[ranked.length - 1]![0] : null,
      elo: Math.round(elo.get(player.id) ?? ELO_START),
      sessionsAttended: new Set(mine.map((m) => m.date)).size,
    };
  });
}

export interface HeadToHead {
  a: StatPlayer;
  b: StatPlayer;
  aWins: number;
  bWins: number;
  played: number;
  /** Newest first. */
  recent: StatMatch[];
}

/** Every match where the two were on opposite sides; a 1v1v1's two winners never met in this sense. */
export function headToHead(a: StatPlayer, b: StatPlayer, matches: StatMatch[]): HeadToHead {
  let aWins = 0;
  let bWins = 0;
  const met: StatMatch[] = [];
  for (const m of matches) {
    const aSide = m.sideA.some((p) => p.id === a.id) ? "a" : m.sideB.some((p) => p.id === a.id) ? "b" : null;
    const bSide = m.sideA.some((p) => p.id === b.id) ? "a" : m.sideB.some((p) => p.id === b.id) ? "b" : null;
    if (!aSide || !bSide || aSide === bSide) continue;
    met.push(m);
    if (m.winnerSide === aSide) aWins += 1;
    else bWins += 1;
  }
  return { a, b, aWins, bWins, played: aWins + bWins, recent: met.reverse().slice(0, 10) };
}

export function headToHeadMatrix(
  players: StatPlayer[],
  matches: StatMatch[],
): Record<number, Record<number, { wins: number; played: number }>> {
  const out: Record<number, Record<number, { wins: number; played: number }>> = {};
  for (const a of players) {
    out[a.id] = {};
    for (const b of players) {
      if (a.id === b.id) continue;
      const h = headToHead(a, b, matches);
      out[a.id]![b.id] = { wins: h.aWins, played: h.played };
    }
  }
  return out;
}

export function nemesisAndPrey(player: StatPlayer, players: StatPlayer[], matches: StatMatch[]) {
  const rows = players
    .filter((p) => p.id !== player.id)
    .map((p) => ({ opponent: p, h: headToHead(player, p, matches) }))
    .filter((r) => r.h.played > 0);
  const nemesis = [...rows].sort((x, y) => y.h.bWins - x.h.bWins || x.h.aWins - y.h.aWins)[0];
  const prey = [...rows].sort((x, y) => y.h.aWins - x.h.aWins || x.h.bWins - y.h.bWins)[0];
  return {
    nemesis:
      nemesis && nemesis.h.bWins > 0
        ? { player: nemesis.opponent, losses: nemesis.h.bWins, played: nemesis.h.played }
        : null,
    prey: prey && prey.h.aWins > 0 ? { player: prey.opponent, wins: prey.h.aWins, played: prey.h.played } : null,
  };
}

const margin = (m: StatMatch) => (m.scoreA != null && m.scoreB != null ? Math.abs(m.scoreA - m.scoreB) : null);
const total = (m: StatMatch) => (m.scoreA != null && m.scoreB != null ? m.scoreA + m.scoreB : null);

export function records(matches: StatMatch[]) {
  const scored = matches.filter((m) => margin(m) != null);
  const biggestMargin = [...scored].sort((a, b) => margin(b)! - margin(a)!)[0] ?? null;
  const closest = [...scored].sort((a, b) => margin(a)! - margin(b)! || total(b)! - total(a)!)[0] ?? null;
  const longest = [...scored].sort((a, b) => total(b)! - total(a)!)[0] ?? null;
  const byDay = new Map<string, { count: number; bill: number }>();
  for (const m of matches) {
    const d = byDay.get(m.date) ?? { count: 0, bill: 0 };
    d.count += 1;
    d.bill += m.bill ?? 0;
    byDay.set(m.date, d);
  }
  const days = [...byDay.entries()];
  const busiestDay = days.sort((a, b) => b[1].count - a[1].count)[0] ?? null;
  const priciestDay = [...byDay.entries()].sort((a, b) => b[1].bill - a[1].bill)[0] ?? null;
  const comebacks = matches.filter((m) => m.tags.includes("#comeback"));
  return {
    biggestMargin: biggestMargin ? { match: biggestMargin, margin: margin(biggestMargin)! } : null,
    closest: closest ? { match: closest, margin: margin(closest)! } : null,
    longest: longest ? { match: longest, total: total(longest)! } : null,
    busiestDay: busiestDay ? { date: busiestDay[0], count: busiestDay[1].count } : null,
    priciestDay: priciestDay && priciestDay[1].bill > 0 ? { date: priciestDay[0], bill: priciestDay[1].bill } : null,
    latestComeback: comebacks.at(-1) ?? null,
  };
}

export interface MoneyBreakdown {
  total: number;
  matchesWithBill: number;
  avgPerMatch: number;
  byPlayer: { player: StatPlayer; paid: number }[];
  byGameType: Record<GameType, { total: number; count: number; avg: number }>;
  byDate: { date: string; total: number }[];
}

export function money(players: StatPlayer[], matches: StatMatch[]): MoneyBreakdown {
  const stats = computePlayerStats(players, matches);
  const byGameType = {
    "3c_real": { total: 0, count: 0, avg: 0 },
    "3c_fake": { total: 0, count: 0, avg: 0 },
    libre: { total: 0, count: 0, avg: 0 },
  } as MoneyBreakdown["byGameType"];
  const byDate = new Map<string, number>();
  let totalBill = 0;
  let count = 0;
  for (const m of matches) {
    if (!m.bill) continue;
    totalBill += m.bill;
    count += 1;
    byGameType[m.gameType].total += m.bill;
    byGameType[m.gameType].count += 1;
    byDate.set(m.date, (byDate.get(m.date) ?? 0) + m.bill);
  }
  for (const v of Object.values(byGameType)) v.avg = v.count ? Math.round(v.total / v.count) : 0;
  return {
    total: totalBill,
    matchesWithBill: count,
    avgPerMatch: count ? Math.round(totalBill / count) : 0,
    byPlayer: stats.map((s) => ({ player: s.player, paid: s.paid })).sort((a, b) => b.paid - a.paid),
    byGameType,
    byDate: [...byDate.entries()].map(([date, t]) => ({ date, total: t })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export type AchievementId = "sniper_3c" | "atm" | "phoenix" | "clock" | "unstoppable" | "upset_king";

export function achievements(stats: PlayerStats[], matches: StatMatch[]): Record<number, AchievementId[]> {
  const out: Record<number, AchievementId[]> = {};
  const topPayer = [...stats].sort((a, b) => b.paid - a.paid)[0];
  for (const s of stats) {
    const list: AchievementId[] = [];
    const c3 = {
      wins: s.byGameType["3c_real"].wins + s.byGameType["3c_fake"].wins,
      played: s.byGameType["3c_real"].played + s.byGameType["3c_fake"].played,
    };
    if (c3.wins >= 10 && c3.wins / c3.played >= 0.6) list.push("sniper_3c");
    if (topPayer && topPayer.player.id === s.player.id && s.paid > 0) list.push("atm");
    const wonTagged = (tag: string) =>
      matches.some((m) => m.tags.includes(tag) && sidesOf(m).winners.some((p) => p.id === s.player.id));
    if (wonTagged("#comeback")) list.push("phoenix");
    if (s.sessionsAttended >= 20) list.push("clock");
    if (s.longestWinStreak >= 5) list.push("unstoppable");
    if (wonTagged("#lật-kèo")) list.push("upset_king");
    out[s.player.id] = list;
  }
  return out;
}

/** "Truy nã": 5+ losses in a row → bounty = what they paid this month. */
export function wanted(stats: PlayerStats[], monthMatches: StatMatch[], players: StatPlayer[]) {
  const monthPaid = new Map(computePlayerStats(players, monthMatches).map((s) => [s.player.id, s.paid]));
  return stats
    .filter((s) => s.current?.result === "L" && s.current.length >= 5)
    .map((s) => ({ player: s.player, streak: s.current!.length, bounty: monthPaid.get(s.player.id) ?? 0 }));
}

/** The most balanced pair with enough history (≥ 4 meetings). */
export function rivalry(players: StatPlayer[], matches: StatMatch[]): HeadToHead | null {
  let best: HeadToHead | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const h = headToHead(players[i]!, players[j]!, matches);
      if (h.played < 4) continue;
      const score = Math.abs(h.aWins - h.bWins) / h.played - h.played / 1000;
      if (score < bestScore) {
        bestScore = score;
        best = h;
      }
    }
  }
  return best;
}

export type SpecialReason = "streak_broken" | "comeback" | "derby" | "blowout";

/** Why a match deserves a poster (requirement: special-match rules), or null. */
export function specialReason(match: StatMatch, before: StatMatch[]): SpecialReason | null {
  const { winners, losers } = sidesOf(match);
  const statsBefore = computePlayerStats(losers, before);
  if (statsBefore.some((s) => s.current?.result === "W" && s.current.length >= 4)) return "streak_broken";
  if (match.tags.includes("#comeback")) return "comeback";
  const m = margin(match);
  const target = Math.max(match.scoreA ?? 0, match.scoreB ?? 0);
  if (m != null && target > 0 && m / target >= 0.6) return "blowout";
  const d = new Date(`${match.date}T00:00:00Z`);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  if (match.format === "1v1" && d.getUTCDate() >= lastDay - 2) {
    const elo = computeElo(before).ratings;
    const top = [...elo.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => id);
    const ids = [...winners, ...losers].map((p) => p.id);
    if (top.length === 2 && top.every((id) => ids.includes(id))) return "derby";
  }
  return null;
}
