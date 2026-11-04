import { playerInputSchema, type PlayerInput } from "@/server/players/schema";

import { BALL_PALETTE } from "./palette";
import type { AdminPlayer } from "../types";

/** Text-field state of the player form: numbers and lists stay strings until submit. */
export interface PlayerFormState {
  name: string;
  slug: string;
  nickname: string;
  aliases: string;
  ballColor: string;
  ballNumber: string;
  catchphrase: string;
  active: boolean;
  avatarUrl: string | null;
}

export type PlayerField = keyof PlayerInput;

export function initialForm(player: AdminPlayer | null, nextBallNumber: number): PlayerFormState {
  return {
    name: player?.name ?? "",
    slug: player?.slug ?? "",
    nickname: player?.nickname ?? "",
    aliases: player?.aliases.join(", ") ?? "",
    ballColor: player?.ballColor ?? BALL_PALETTE[0].hex,
    ballNumber: String(player?.ballNumber ?? nextBallNumber),
    catchphrase: player?.catchphrase ?? "",
    active: player?.active ?? true,
    avatarUrl: player?.avatarUrl ?? null,
  };
}

/** "lâm béo, thằng lâm" → ["lâm béo", "thằng lâm"]; blanks and repeats are dropped. */
export function splitAliases(text: string): string[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  ];
}

/** Lowercase ASCII slug of a name ("Thén Sát" → "then-sat"), cut to the schema's 24 characters. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/, "");
}

export function toInput(form: PlayerFormState): PlayerInput {
  return {
    name: form.name,
    slug: form.slug,
    nickname: form.nickname.trim() || null,
    aliases: splitAliases(form.aliases),
    avatarUrl: form.avatarUrl,
    ballColor: form.ballColor.trim(),
    ballNumber: Number(form.ballNumber),
    catchphrase: form.catchphrase.trim() || null,
    active: form.active,
  };
}

/** Runs the server's own schema on the form; returns the input, or the fields that failed. */
export function validateForm(form: PlayerFormState): { input: PlayerInput } | { fields: Set<PlayerField> } {
  const parsed = playerInputSchema.safeParse(toInput(form));
  if (parsed.success) return { input: parsed.data };
  return { fields: new Set(parsed.error.issues.map((i) => i.path[0] as PlayerField)) };
}

export function isValidColour(value: string): boolean {
  return playerInputSchema.shape.ballColor.safeParse(value.trim()).success;
}
