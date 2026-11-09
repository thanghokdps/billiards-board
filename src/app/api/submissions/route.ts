import { NextResponse } from "next/server";

import { route } from "@/server/http";
import { submitMatch } from "@/server/submissions/service";

/** Public on purpose: it only stores a pending row; the admin decides. */
export const POST = route(async (request) => {
  const result = await submitMatch(request);
  return NextResponse.json(result, { status: "id" in result ? 201 : 200 });
});
