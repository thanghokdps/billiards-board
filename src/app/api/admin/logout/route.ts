import { NextResponse } from "next/server";

import { ADMIN_COOKIE, sessionCookieOptions } from "@/server/auth/session";
import { route } from "@/server/http";

export const POST = route(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
});
