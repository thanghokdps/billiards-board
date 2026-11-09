import "server-only";

import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { matchPlayers, players, type Player } from "@/db/schema";
import { recordAudit } from "@/server/audit/repository";
import { HttpError } from "@/server/http";

import { listPlayers } from "./repository";
import type { PlayerInput, PlayerPatch } from "./schema";

const who = { actor: "admin", via: "ui" as const };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "23505"
  );
}

export async function createPlayer(input: PlayerInput): Promise<Player> {
  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(players)
        .values({ ...input, aliases: input.aliases ?? [] })
        .returning();
      if (!row) throw new Error("player insert returned no row");
      await recordAudit(tx, { ...who, action: "create", entity: "player", entityId: String(row.id), after: row });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError("conflict");
    throw error;
  }
}

const GUEST_PALETTE = ["#8b9bb4", "#a08cb8", "#7fae9d", "#b8a27f", "#b88a8a", "#7f9fb8", "#9aae7f", "#b8947f"];

function guestSlug(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12)
    .replace(/-$/, "");
  return `g-${ascii || "guest"}-${randomBytes(2).toString("hex")}`;
}

function guestColor(name: string): string {
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return GUEST_PALETTE[hash % GUEST_PALETTE.length]!;
}

/** Idempotent quick-add: an active guest with this name (case-insensitive) is returned, an active member's name is a conflict. */
export async function createGuest(name: string): Promise<Player> {
  const wanted = name.trim().toLowerCase();
  const same = (await listPlayers()).find((p) => p.name.trim().toLowerCase() === wanted);
  if (same) {
    if (same.guest) return same;
    throw new HttpError("conflict");
  }
  return createPlayer({
    name: name.trim(),
    slug: guestSlug(name),
    ballColor: guestColor(name),
    ballNumber: 0,
    guest: true,
  });
}

export async function updatePlayer(id: number, patch: PlayerPatch): Promise<Player> {
  try {
    return await db.transaction(async (tx) => {
      const [before] = await tx.select().from(players).where(eq(players.id, id)).limit(1);
      if (!before) throw new HttpError("not_found");
      const [after] = await tx.update(players).set(patch).where(eq(players.id, id)).returning();
      await recordAudit(tx, { ...who, action: "update", entity: "player", entityId: String(id), before, after });
      return after!;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError("conflict");
    throw error;
  }
}

/** A player with matches is archived (inactive) so history stays intact; one without is removed. */
export async function deletePlayer(id: number): Promise<{ archived: boolean }> {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(players).where(eq(players.id, id)).limit(1);
    if (!before) throw new HttpError("not_found");
    const [played] = await tx
      .select({ id: matchPlayers.matchId })
      .from(matchPlayers)
      .where(eq(matchPlayers.playerId, id))
      .limit(1);
    if (played) {
      await tx.update(players).set({ active: false }).where(eq(players.id, id));
    } else {
      await tx.delete(players).where(eq(players.id, id));
    }
    await recordAudit(tx, { ...who, action: "delete", entity: "player", entityId: String(id), before });
    return { archived: Boolean(played) };
  });
}
