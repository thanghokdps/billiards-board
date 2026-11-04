import { NextResponse } from "next/server";
import { z } from "zod";

import { clearFailures, clientKey, recordFailure, retryAfter } from "@/server/auth/login-limit";
import { ADMIN_COOKIE, createSessionToken, passwordMatches, sessionCookieOptions } from "@/server/auth/session";
import { HttpError, parseJson, route } from "@/server/http";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export const POST = route(async (request) => {
  const key = clientKey(request);
  const wait = retryAfter(key);
  if (wait > 0)
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(wait) } });
  const { password } = await parseJson(request, bodySchema);
  if (!passwordMatches(password)) {
    await recordFailure(key);
    throw new HttpError("unauthenticated");
  }
  clearFailures(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
});
