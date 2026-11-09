import { NextResponse } from "next/server";

import { parseJson, requirePlayer, route, uuidParam } from "@/server/http";
import { scheduleInputSchema } from "@/server/submissions/schema";
import { editSchedule, getOwnTemp } from "@/server/submissions/temp-matches";

type Context = { params: Promise<{ id: string }> };

/** The schedule (and result, once entered) for prefilling; only for members seated in it. */
export const GET = route(async (request, { params }: Context) => {
  const caller = await requirePlayer(request);
  const id = uuidParam((await params).id);
  return NextResponse.json(await getOwnTemp(caller, id));
});

/** Change players, format or time while the match is unplayed. */
export const PATCH = route(async (request, { params }: Context) => {
  const caller = await requirePlayer(request);
  const id = uuidParam((await params).id);
  const schedule = await parseJson(request, scheduleInputSchema);
  return NextResponse.json({ match: await editSchedule(caller, id, schedule) });
});
