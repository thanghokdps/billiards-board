import { NextResponse } from "next/server";

import { googleConfigured, newAuthRequest } from "@/server/auth/google";
import { OAUTH_COOKIE, oauthCookieOptions, safeReturnTo, sealOAuthState } from "@/server/auth/player-session";
import { HttpError, route } from "@/server/http";

/** Starts Google sign-in: state + PKCE verifier go in a signed 10-minute cookie, then off to Google. */
export const GET = route(async (request) => {
  if (!googleConfigured()) throw new HttpError("not_found");
  const url = new URL(request.url);
  const { url: target, state, verifier } = newAuthRequest(url.origin);
  const response = NextResponse.redirect(target);
  response.cookies.set(
    OAUTH_COOKIE,
    sealOAuthState({ state, verifier, returnTo: safeReturnTo(url.searchParams.get("returnTo")) }),
    oauthCookieOptions,
  );
  return response;
});
