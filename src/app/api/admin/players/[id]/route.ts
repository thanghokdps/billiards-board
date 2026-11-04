import { NextResponse } from "next/server";

import { intParam, parseJson, requireAdmin, route } from "@/server/http";
import { playerPatchSchema } from "@/server/players/schema";
import { deletePlayer, updatePlayer } from "@/server/players/service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const id = intParam((await params).id);
  const patch = await parseJson(request, playerPatchSchema);
  return NextResponse.json({ player: await updatePlayer(id, patch) });
});

export const DELETE = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const id = intParam((await params).id);
  return NextResponse.json(await deletePlayer(id));
});
