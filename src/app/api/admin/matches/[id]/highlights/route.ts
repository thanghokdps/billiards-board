import { NextResponse } from "next/server";
import { z } from "zod";

import { addHighlight } from "@/server/highlights/repository";
import { HttpError, parseJson, requireAdmin, route } from "@/server/http";
import { findMatchById } from "@/server/matches/repository";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    mediaId: z.uuid().nullable().optional(),
    url: z
      .url({ protocol: /^https$/ })
      .max(500)
      .nullable()
      .optional(),
    caption: z.string().trim().max(140).nullable().optional(),
  })
  .refine((b) => Boolean(b.mediaId) !== Boolean(b.url), "give exactly one of mediaId or url");

export const POST = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const { id } = await params;
  const match = await findMatchById(id);
  if (!match || match.deleted) throw new HttpError("not_found");
  const body = await parseJson(request, bodySchema);
  const highlight = await addHighlight({
    matchId: id,
    mediaId: body.mediaId ?? null,
    url: body.url ?? null,
    caption: body.caption ?? null,
  });
  return NextResponse.json({ highlight }, { status: 201 });
});
