/** Framework-free domain constants and helpers shared by server, agent and UI. */

export const GAME_TYPES = ["3c_real", "3c_fake", "libre"] as const;
export type GameType = (typeof GAME_TYPES)[number];
/** Display names, the same in every language. */
export const GAME_LABEL: Record<GameType, string> = { "3c_real": "3C Real", "3c_fake": "3C Fake", libre: "Libre" };
export const MATCH_FORMATS = ["1v1", "2v2", "1v1v1"] as const;
export type MatchFormat = (typeof MATCH_FORMATS)[number];
export type Side = "a" | "b";
export const PLAYERS_IN_FORMAT: Record<MatchFormat, number> = { "1v1": 2, "2v2": 4, "1v1v1": 3 };

/**
 * A 1v1v1 has one loser who pays and two winners, so it is stored as two sides: sideA = the winners,
 * sideB = the loser, winnerSide "a". Only Elo and display tell it apart; the winners are not a team.
 */
export function formatOfSides(sizeA: number, sizeB: number): MatchFormat | null {
  if (sizeA === 1 && sizeB === 1) return "1v1";
  if (sizeA === 2 && sizeB === 2) return "2v2";
  return sizeA === 2 && sizeB === 1 ? "1v1v1" : null;
}

/** "A & B vs C & D", or "A vs B vs C" for a 1v1v1. */
export function matchTitle(
  match: { format: MatchFormat; sideA: { name: string }[]; sideB: { name: string }[] },
  vs = "vs",
): string {
  const names = (side: { name: string }[]) => side.map((p) => p.name);
  if (match.format === "1v1v1") return [...names(match.sideA), ...names(match.sideB)].join(` ${vs} `);
  return `${names(match.sideA).join(" & ")} ${vs} ${names(match.sideB).join(" & ")}`;
}

/** "40-32", or "A 40, B 32, C 18" for a 1v1v1; null when no score was recorded. */
export function scoreLine(match: {
  sideA: { id: number; name: string }[];
  sideB: { id: number; name: string }[];
  scoreA: number | null;
  scoreB: number | null;
  scores: { playerId: number; score: number }[];
}): string | null {
  if (match.scores.length > 0) {
    const scoreOf = (id: number) => match.scores.find((s) => s.playerId === id)?.score;
    return [...match.sideA, ...match.sideB].map((p) => `${p.name} ${scoreOf(p.id)}`).join(", ");
  }
  return match.scoreA != null && match.scoreB != null ? `${match.scoreA}-${match.scoreB}` : null;
}

export const MATCH_TAGS = ["#comeback", "#kèo-thơm", "#trận-cầu-danh-dự", "#lật-kèo"] as const;

export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

/** Local calendar date (YYYY-MM-DD) of an instant in the app time zone. */
export function localDate(at: Date, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** Monday-based ISO week key, e.g. 2026-W45. */
export function weekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type Period = "all" | "week" | "month" | "year";

/** Inclusive start date (YYYY-MM-DD) of the period containing `today`, or null for all time. */
export function periodStart(period: Period, today: string): string | null {
  if (period === "all") return null;
  const d = new Date(`${today}T00:00:00Z`);
  if (period === "year") return `${d.getUTCFullYear()}-01-01`;
  if (period === "month") return `${today.slice(0, 7)}-01`;
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function formatVnd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactVnd(amount: number, locale: string): string {
  if (Math.abs(amount) >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}${locale === "en" ? "M" : "tr"}`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return String(amount);
}

export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

// Node's ICU abbreviates Vietnamese weekdays as "Th 2" while Chrome says "Thứ 2", which breaks hydration; the short form is built by hand.
const SHORT_WEEKDAY = {
  vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export function formatDate(dateStr: string, locale: string, style: "short" | "long" = "short"): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (style === "short") {
    const weekday = SHORT_WEEKDAY[locale === "en" ? "en" : "vi"][d.getUTCDay()];
    return `${weekday}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  }
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(at: Date | string, locale: string, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof at === "string" ? new Date(at) : at);
}
