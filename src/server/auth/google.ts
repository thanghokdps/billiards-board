import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { getServerEnv } from "@/server/env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const TIMEOUT_MS = 8000;

export function googleConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export const callbackUrl = (origin: string): string => `${origin}/api/auth/google/callback`;

/** A fresh state and PKCE pair; the verifier stays in our signed cookie, only its S256 hash goes to Google. */
export function newAuthRequest(origin: string): { url: string; state: string; verifier: string } {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: getServerEnv().GOOGLE_CLIENT_ID ?? "",
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { url: `${AUTH_URL}?${params}`, state, verifier };
}

const tokenSchema = z.object({ access_token: z.string().min(1) });
const userinfoSchema = z.object({ email: z.email(), email_verified: z.boolean() });

/**
 * Trades the code for an access token and reads the verified email from the userinfo endpoint, so no ID token
 * is ever decoded here. Returns null on any refusal from Google.
 */
export async function verifiedEmail(code: string, verifier: string, origin: string): Promise<string | null> {
  const env = getServerEnv();
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!tokenRes.ok) return null;
  const token = tokenSchema.safeParse(await tokenRes.json());
  if (!token.success) return null;

  const infoRes = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${token.data.access_token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!infoRes.ok) return null;
  const info = userinfoSchema.safeParse(await infoRes.json());
  if (!info.success || !info.data.email_verified) return null;
  return info.data.email.toLowerCase();
}
