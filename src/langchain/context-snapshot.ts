import "server-only";

import { formatTime, localDate, matchTitle, scoreLine } from "@/lib/domain";
import { findMatches } from "@/server/matches/repository";
import { listPlayers } from "@/server/players/repository";

import type { AgentContext } from "./context";
import type { ContextSnapshot } from "./prompts";

const GAME = { "3c_real": "3C Real", "3c_fake": "3C Fake", libre: "Libre" } as const;

/** Reads what CONTEXT shows, fresh for each model call, so a match saved a moment ago is already known. */
export async function loadContextSnapshot(context: AgentContext, now: Date): Promise<ContextSnapshot> {
  const today = localDate(now, context.timeZone);
  const [roster, todays] = await Promise.all([
    listPlayers(),
    findMatches({ from: today, to: today, order: "desc", limit: 15 }),
  ]);
  return {
    now:
      new Intl.DateTimeFormat("en-GB", { timeZone: context.timeZone, dateStyle: "full", timeStyle: "short" }).format(
        now,
      ) + ` · date ${today}`,
    timeZone: context.timeZone,
    locale: context.locale,
    roster: roster.map(
      (p) =>
        `${p.id} · ${p.name} · ${p.nickname ?? "-"} · ${p.aliases.length ? p.aliases.join(", ") : "-"} · ball ${p.ballNumber}`,
    ),
    todaysMatches: todays.map((m) => {
      const side = (list: typeof m.sideA) => list.map((p) => p.name).join(" & ");
      const bill = m.bill != null ? `${m.bill} VND` : "no bill";
      const result =
        m.format === "1v1v1"
          ? `loser ${side(m.sideB)}`
          : `winner ${m.winnerSide === "a" ? side(m.sideA) : side(m.sideB)}`;
      return `${m.id} · ${formatTime(m.playedAt, "en", context.timeZone)} · ${GAME[m.gameType]} · ${matchTitle(m)} · ${scoreLine(m) ?? "no score"} · ${result} · ${bill}`;
    }),
  };
}
