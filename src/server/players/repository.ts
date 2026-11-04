import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { players, type Player } from "@/db/schema";

import type { PlayerRef } from "../matches/schema";

export function toPlayerRef(p: Player): PlayerRef {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nickname: p.nickname,
    ballColor: p.ballColor,
    ballNumber: p.ballNumber,
    avatarUrl: p.avatarUrl,
  };
}

export async function listPlayers(options: { includeInactive?: boolean } = {}): Promise<Player[]> {
  const rows = await db.select().from(players).orderBy(asc(players.ballNumber));
  return options.includeInactive ? rows : rows.filter((p) => p.active);
}

export async function getPlayerBySlug(slug: string): Promise<Player | undefined> {
  const [row] = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
  return row;
}

export async function getPlayerById(id: number): Promise<Player | undefined> {
  const [row] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return row;
}
