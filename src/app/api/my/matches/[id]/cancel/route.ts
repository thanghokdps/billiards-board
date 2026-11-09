import { NextResponse } from "next/server";

import { requirePlayer, route, uuidParam } from "@/server/http";
import { cancelTemp } from "@/server/submissions/temp-matches";

type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request, { params }: Context) => {
  const caller = await requirePlayer(request);
  const id = uuidParam((await params).id);
  await cancelTemp(caller, id);
  return NextResponse.json({ ok: true });
});
