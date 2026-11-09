import { NextResponse } from "next/server";

import { requireAdmin, route } from "@/server/http";
import { listPendingSubmissions } from "@/server/submissions/service";

export const GET = route(async (request) => {
  await requireAdmin(request);
  return NextResponse.json({ submissions: await listPendingSubmissions() });
});
