import { NextResponse } from "next/server";

import { parseJson, requirePlayer, route } from "@/server/http";
import { scheduleInputSchema } from "@/server/submissions/schema";
import { createTemp } from "@/server/submissions/temp-matches";

/** A signed-in member schedules a temp match they play in. */
export const POST = route(async (request) => {
  const caller = await requirePlayer(request);
  const schedule = await parseJson(request, scheduleInputSchema);
  const match = await createTemp(caller, schedule);
  return NextResponse.json({ match }, { status: 201 });
});
