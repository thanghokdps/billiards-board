import { NextResponse } from "next/server";

import { PLAYER_COOKIE } from "@/server/auth/player-session";
import { ADMIN_COOKIE, sessionCookieOptions } from "@/server/auth/session";
import { route } from "@/server/http";

/** Signs out everywhere: the member session and, if it came with sign-in, the admin one. */
export const POST = route(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PLAYER_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  response.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
});
