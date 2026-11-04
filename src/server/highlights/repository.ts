import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { highlights, type Highlight } from "@/db/schema";

export async function addHighlight(input: {
  matchId: string;
  mediaId: string | null;
  url: string | null;
  caption: string | null;
}): Promise<Highlight> {
  const [row] = await db.insert(highlights).values(input).returning();
  if (!row) throw new Error("highlight insert returned no row");
  return row;
}

export async function deleteHighlight(id: number, matchId: string): Promise<boolean> {
  const rows = await db
    .delete(highlights)
    .where(and(eq(highlights.id, id), eq(highlights.matchId, matchId)))
    .returning({ id: highlights.id });
  return rows.length > 0;
}

export async function highlightsFor(matchIds: string[]): Promise<Highlight[]> {
  if (matchIds.length === 0) return [];
  return db.select().from(highlights).where(inArray(highlights.matchId, matchIds)).orderBy(desc(highlights.createdAt));
}

export async function latestHighlights(limit = 24): Promise<Highlight[]> {
  return db.select().from(highlights).orderBy(desc(highlights.createdAt)).limit(Math.min(limit, 100));
}
