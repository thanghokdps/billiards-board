import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route } from "@/server/http";
import { createMatchesBodySchema } from "@/server/matches/schema";
import { createMatches } from "@/server/matches/service";

export const POST = route(async (request) => {
  const { actor } = await requireAdmin(request);
  const body = await parseJson(request, createMatchesBodySchema);
  const created = await createMatches(body.matches, { actor, via: body.via }, { idempotencyKey: body.idempotencyKey });
  return NextResponse.json(created, { status: 201 });
});
