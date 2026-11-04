import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { sessions, type Session } from "@/db/schema";

import { getOrCreateSession } from "../matches/repository";

export async function getSessionByDate(date: string): Promise<Session | undefined> {
  const [row] = await db.select().from(sessions).where(eq(sessions.date, date)).limit(1);
  return row;
}

export async function updateSession(
  date: string,
  patch: { attendees?: number[]; venue?: string | null; tableLabel?: string | null },
): Promise<Session> {
  return db.transaction(async (tx) => {
    const id = await getOrCreateSession(date, tx);
    const [row] = await tx.update(sessions).set(patch).where(eq(sessions.id, id)).returning();
    if (!row) throw new Error("session update returned no row");
    return row;
  });
}
