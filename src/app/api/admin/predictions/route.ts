import { NextResponse } from "next/server";
import { z } from "zod";

import { GAME_TYPES } from "@/lib/domain";
import { parseJson, requireAdmin, route } from "@/server/http";
import { createPrediction } from "@/server/predictions/repository";

const id = z.number().int().positive();

const bodySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gameType: z.enum(GAME_TYPES).nullable().default(null),
    sideA: z.array(id).min(1).max(2),
    sideB: z.array(id).min(1).max(2),
  })
  .refine((b) => b.sideA.length === b.sideB.length, "both sides need the same size")
  .refine(
    (b) => new Set([...b.sideA, ...b.sideB]).size === b.sideA.length + b.sideB.length,
    "a player cannot be on both sides",
  );

export const POST = route(async (request) => {
  await requireAdmin(request);
  const body = await parseJson(request, bodySchema);
  return NextResponse.json({ prediction: await createPrediction(body) }, { status: 201 });
});
