import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { players, type Player } from "@/db/schema";

import type { PlayerRef } from "../matches/schema";

/** `note` is admin-only, so it stays out of the ref every public page and the agent receive. */
export function toPlayerRef(p: Player): PlayerRef {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nickname: p.nickname,
    ballColor: p.ballColor,
    ballNumber: p.ballNumber,
    avatarUrl: p.avatarUrl,
    guest: p.guest,
  };
}

export async function listPlayers(
  options: { includeInactive?: boolean; guests?: "include" | "exclude" | "only" } = {},
): Promise<Player[]> {
  const { includeInactive, guests = "include" } = options;
  const rows = await db.select().from(players).orderBy(asc(players.ballNumber), asc(players.id));
  return rows.filter((p) => (includeInactive || p.active) && (guests === "include" || p.guest === (guests === "only")));
}

export async function getPlayerBySlug(slug: string): Promise<Player | undefined> {
  const [row] = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
  return row;
}

export async function getPlayerById(id: number): Promise<Player | undefined> {
  const [row] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return row;
}
