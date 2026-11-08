import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route, uuidParam } from "@/server/http";
import { rejectBodySchema } from "@/server/submissions/schema";
import { rejectSubmission } from "@/server/submissions/service";

type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request, { params }: Context) => {
  const { actor } = await requireAdmin(request);
  const id = uuidParam((await params).id);
  const { via } = await parseJson(request, rejectBodySchema);
  return NextResponse.json(await rejectSubmission(id, { actor, via }));
});
