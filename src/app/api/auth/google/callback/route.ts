import { NextResponse } from "next/server";

import { googleConfigured, verifiedEmail } from "@/server/auth/google";
import {
  createPlayerToken,
  OAUTH_COOKIE,
  oauthCookieOptions,
  openOAuthState,
  PLAYER_COOKIE,
  safeReturnTo,
} from "@/server/auth/player-session";
import { ADMIN_COOKIE, createSessionToken, sessionCookieOptions } from "@/server/auth/session";
import { getServerEnv } from "@/server/env";
import { HttpError, route } from "@/server/http";
import { findMemberByEmail } from "@/server/players/repository";

type Outcome = "ok" | "failed" | "denied";

function land(origin: string, path: string, outcome: Outcome): NextResponse {
  const resolved = new URL(safeReturnTo(path), origin);
  // Belt and braces: never leave our own origin, whatever the cookie held.
  const target = resolved.origin === origin ? resolved : new URL("/", origin);
  if (outcome !== "ok") target.searchParams.set("login", outcome);
  const response = NextResponse.redirect(target);
  response.cookies.set(OAUTH_COOKIE, "", { ...oauthCookieOptions, maxAge: 0 });
  return response;
}

/** Google's redirect back: the state must match our cookie, then only a member's email (or an admin's) signs in. */
export const GET = route(async (request) => {
  if (!googleConfigured()) throw new HttpError("not_found");
  const url = new URL(request.url);
  const saved = openOAuthState(request);
  const returnTo = saved?.returnTo ?? "/";
  const code = url.searchParams.get("code");
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return land(url.origin, returnTo, "failed");

  let email: string | null;
  try {
    email = await verifiedEmail(code, saved.verifier, url.origin);
  } catch (error) {
    console.error("[auth] google exchange failed:", error instanceof Error ? error.message : error);
    email = null;
  }
  if (!email) return land(url.origin, returnTo, "failed");

  const member = await findMemberByEmail(email);
  const admin = getServerEnv().ADMIN_EMAILS.includes(email);
  if (!member && !admin) return land(url.origin, returnTo, "denied");

  const response = land(url.origin, returnTo, "ok");
  if (member) response.cookies.set(PLAYER_COOKIE, createPlayerToken(member.id), sessionCookieOptions);
  if (admin) response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
});
