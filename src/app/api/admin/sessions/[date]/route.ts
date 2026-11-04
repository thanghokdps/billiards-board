import { NextResponse } from "next/server";
import { z } from "zod";

import { HttpError, parseJson, requireAdmin, route } from "@/server/http";
import { updateSession } from "@/server/sessions/repository";

type Context = { params: Promise<{ date: string }> };

const bodySchema = z.object({
  attendees: z.array(z.number().int().positive()).max(20).optional(),
  venue: z.string().trim().max(60).nullable().optional(),
  tableLabel: z.string().trim().max(30).nullable().optional(),
});

export const PUT = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError("not_found");
  const patch = await parseJson(request, bodySchema);
  return NextResponse.json({ session: await updateSession(date, patch) });
});
