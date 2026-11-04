import { NextResponse } from "next/server";

import { HttpError, intParam, requireAdmin, route } from "@/server/http";
import { cancelPrediction } from "@/server/predictions/repository";

type Context = { params: Promise<{ id: string }> };

export const DELETE = route(async (request, { params }: Context) => {
  await requireAdmin(request);
  if (!(await cancelPrediction(intParam((await params).id)))) throw new HttpError("not_found");
  return NextResponse.json({ ok: true });
});
