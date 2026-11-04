import { NextResponse } from "next/server";

import { deleteHighlight } from "@/server/highlights/repository";
import { HttpError, intParam, requireAdmin, route } from "@/server/http";

type Context = { params: Promise<{ id: string; hid: string }> };

export const DELETE = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  const { id, hid } = await params;
  if (!(await deleteHighlight(intParam(hid), id))) throw new HttpError("not_found");
  return NextResponse.json({ ok: true });
});
