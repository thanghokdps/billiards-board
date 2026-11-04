import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route } from "@/server/http";
import { playerInputSchema } from "@/server/players/schema";
import { createPlayer } from "@/server/players/service";

export const POST = route(async (request) => {
  await requireAdmin(request);
  const input = await parseJson(request, playerInputSchema);
  return NextResponse.json({ player: await createPlayer(input) }, { status: 201 });
});
