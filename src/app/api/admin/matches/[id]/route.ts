import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route, viaOf } from "@/server/http";
import { updateMatchBodySchema } from "@/server/matches/schema";
import { deleteMatch, updateMatch } from "@/server/matches/service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request, { params }: Context) => {
  const { actor } = await requireAdmin(request);
  const { id } = await params;
  const body = await parseJson(request, updateMatchBodySchema);
  return NextResponse.json({ match: await updateMatch(id, body.patch, { actor, via: body.via }) });
});

export const DELETE = route(async (request, { params }: Context) => {
  const { actor } = await requireAdmin(request);
  const { id } = await params;
  return NextResponse.json({ match: await deleteMatch(id, { actor, via: viaOf(request) }) });
});
