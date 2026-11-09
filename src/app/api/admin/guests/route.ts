import { NextResponse } from "next/server";

import { parseJson, requireAdmin, route } from "@/server/http";
import { toPlayerRef } from "@/server/players/repository";
import { guestQuickSchema } from "@/server/players/schema";
import { createGuest } from "@/server/players/service";

export const POST = route(async (request) => {
  await requireAdmin(request);
  const { name } = await parseJson(request, guestQuickSchema);
  return NextResponse.json(toPlayerRef(await createGuest(name)), { status: 201 });
});
