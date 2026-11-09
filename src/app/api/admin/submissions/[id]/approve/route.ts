import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route, uuidParam } from "@/server/http";
import { approveBodySchema } from "@/server/submissions/schema";
import { approveSubmission } from "@/server/submissions/service";

type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request, { params }: Context) => {
  const { actor } = await requireAdmin(request);
  const id = uuidParam((await params).id);
  const { edited, via } = await parseJson(request, approveBodySchema);
  const { matchId, submission } = await approveSubmission(id, { edited, actor, via });
  return NextResponse.json({ matchId, submission });
});
