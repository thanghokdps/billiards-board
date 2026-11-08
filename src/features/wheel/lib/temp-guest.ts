import type { PlayerRef } from "@/server/matches/schema";

/** Stripe colours for a viewer's temporary guests (data, like a player's ball colour). */
const TEMP_PALETTE = ["#8b9bb4", "#a08cb8", "#7fae9d", "#b8a27f", "#b88a8a", "#7f9fb8", "#9aae7f", "#b8947f"];

/** Temporary guests live in the browser only; a negative id keeps them clear of every database id. */
export const isTempGuest = (player: Pick<PlayerRef, "id">): boolean => player.id < 0;

export function makeTempGuest(name: string, existing: PlayerRef[]): PlayerRef {
  const id = Math.min(0, ...existing.map((p) => p.id)) - 1;
  return {
    id,
    slug: `temp-${-id}`,
    name,
    nickname: null,
    ballColor: TEMP_PALETTE[(-id - 1) % TEMP_PALETTE.length]!,
    ballNumber: 0,
    avatarUrl: null,
    guest: true,
  };
}

/** Case-insensitive: "Tuấn" and "tuấn " are the same person on one wheel. */
export function hasName(players: PlayerRef[], name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return players.some((p) => p.name.trim().toLowerCase() === wanted);
}
