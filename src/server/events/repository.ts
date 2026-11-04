import "server-only";

import { desc, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { events } from "@/db/schema";

import type { MatchEvent } from "./types";
import type { Tx } from "../matches/repository";

export type { MatchEvent };

export async function recordEvents(tx: Tx, list: MatchEvent[]): Promise<void> {
  if (list.length === 0) return;
  await tx.insert(events).values(list.map((e) => ({ type: e.type, matchId: e.matchId })));
}

export async function listEvents(limit = 30) {
  return db.select().from(events).orderBy(desc(events.createdAt)).limit(Math.min(limit, 100));
}

export async function eventsForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return [];
  return db.select().from(events).where(inArray(events.matchId, matchIds));
}
