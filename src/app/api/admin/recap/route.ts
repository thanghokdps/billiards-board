import { NextResponse } from "next/server";
import { z } from "zod";

import { RecapUnavailable, writeRecap } from "@/langchain/recap";
import { HttpError, parseJson, requireAdmin, route } from "@/server/http";

export const maxDuration = 60;

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: z.enum(["vi", "en"]).default("vi"),
});

export const POST = route(async (request) => {
  await requireAdmin(request);
  const { date, locale } = await parseJson(request, bodySchema);
  try {
    const text = await writeRecap(date, locale, AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]));
    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof RecapUnavailable) throw new HttpError("not_found");
    throw error;
  }
});
