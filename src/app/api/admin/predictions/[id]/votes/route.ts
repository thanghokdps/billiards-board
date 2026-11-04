import { NextResponse } from "next/server";
import { z } from "zod";

import { HttpError, intParam, parseJson, requireAdmin, route } from "@/server/http";
import { castVote } from "@/server/predictions/repository";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({ voterId: z.number().int().positive(), pick: z.enum(["a", "b"]) });

/** Votes are entered by the admin for each voter: viewers have no login, so no viewer write path exists. */
export const PUT = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const id = intParam((await params).id);
  const { voterId, pick } = await parseJson(request, bodySchema);
  if (!(await castVote(id, voterId, pick))) throw new HttpError("not_found");
  return NextResponse.json({ ok: true });
});
