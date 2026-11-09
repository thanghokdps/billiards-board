import { NextResponse } from "next/server";

import { parseJson, requirePlayer, route, uuidParam } from "@/server/http";
import { submissionInputSchema } from "@/server/submissions/schema";
import { enterResult } from "@/server/submissions/temp-matches";

type Context = { params: Promise<{ id: string }> };

/** Enter (or fix, before the admin decides) the result; the match then waits for approval. */
export const POST = route(async (request, { params }: Context) => {
  const caller = await requirePlayer(request);
  const id = uuidParam((await params).id);
  const input = await parseJson(request, submissionInputSchema);
  return NextResponse.json({ match: await enterResult(caller, id, input) });
});
