import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colour must be #RRGGBB");

export const playerInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,24}$/, "slug: lowercase letters, digits, dashes"),
  nickname: z.string().trim().max(40).nullable().optional(),
  aliases: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(300)
    .refine(
      (u) => u.startsWith("/api/media/") || u.startsWith("https://"),
      "avatar must be an uploaded image or https URL",
    )
    .nullable()
    .optional(),
  ballColor: hex,
  ballNumber: z.number().int().min(1).max(15),
  catchphrase: z.string().trim().max(120).nullable().optional(),
  active: z.boolean().optional(),
});

export type PlayerInput = z.infer<typeof playerInputSchema>;

export const playerPatchSchema = playerInputSchema.partial();
export type PlayerPatch = z.infer<typeof playerPatchSchema>;
