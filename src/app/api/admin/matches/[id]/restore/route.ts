import { NextResponse } from "next/server";

import { requireAdmin, route, viaOf } from "@/server/http";
import { restoreMatch } from "@/server/matches/service";

type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request, { params }: Context) => {
  const { actor } = await requireAdmin(request);
  const { id } = await params;
  return NextResponse.json({ match: await restoreMatch(id, { actor, via: viaOf(request) }) });
});
