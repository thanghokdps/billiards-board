import "server-only";

import { cookies } from "next/headers";

import type { PlayerRef } from "@/server/matches/schema";
import { findSignedInMember, toPlayerRef } from "@/server/players/repository";

import { safeEqual, sessionCookieOptions, sign } from "./session";

export const PLAYER_COOKIE = "anbill_player";
export const OAUTH_COOKIE = "anbill_oauth";
const OAUTH_MAX_AGE_SECONDS = 10 * 60;

/** `<playerId>.<expiresAtSeconds>.<hmac>`: only the id is carried; who they are is re-read from the DB. */
export function createPlayerToken(playerId: number, now = Date.now()): string {
  const expires = Math.floor(now / 1000) + sessionCookieOptions.maxAge;
  return `${playerId}.${expires}.${sign(`player:${playerId}:${expires}`)}`;
}

export function verifyPlayerToken(token: string | undefined, now = Date.now()): number | null {
  if (!token) return null;
  const [id, expires, mac] = token.split(".");
  if (!id || !expires || !mac || !/^\d{1,9}$/.test(id) || !/^\d+$/.test(expires)) return null;
  if (Number(expires) * 1000 < now) return null;
  return safeEqual(mac, sign(`player:${id}:${expires}`)) ? Number(id) : null;
}

export interface SignedInPlayer {
  player: PlayerRef;
  /** Audit actor. */
  actor: string;
}

async function memberOf(token: string | undefined): Promise<SignedInPlayer | null> {
  const id = verifyPlayerToken(token);
  if (id === null) return null;
  const row = await findSignedInMember(id);
  return row ? { player: toPlayerRef(row), actor: `player:${row.slug}` } : null;
}

/** For server components. */
export async function readPlayer(): Promise<SignedInPlayer | null> {
  return memberOf((await cookies()).get(PLAYER_COOKIE)?.value);
}

function cookieFrom(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** For route handlers. */
export async function readPlayerFromRequest(request: Request): Promise<SignedInPlayer | null> {
  return memberOf(cookieFrom(request, PLAYER_COOKIE));
}

interface OAuthState {
  state: string;
  verifier: string;
  returnTo: string;
  exp: number;
}

export const oauthCookieOptions = { ...sessionCookieOptions, maxAge: OAUTH_MAX_AGE_SECONDS };

export function sealOAuthState(value: Omit<OAuthState, "exp">, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...value, exp: Math.floor(now / 1000) + OAUTH_MAX_AGE_SECONDS })).toString(
    "base64url",
  );
  return `${body}.${sign(`oauth:${body}`)}`;
}

export function openOAuthState(request: Request, now = Date.now()): OAuthState | null {
  const raw = cookieFrom(request, OAUTH_COOKIE);
  const [body, mac] = raw?.split(".") ?? [];
  if (!body || !mac || !safeEqual(mac, sign(`oauth:${body}`))) return null;
  try {
    // Cast: the body was written by sealOAuthState and its MAC just verified.
    const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
    return value.exp * 1000 >= now ? value : null;
  } catch {
    return null;
  }
}

const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/**
 * A same-site path to land on after sign-in. Checks the resolved URL, not the string: the URL parser drops tabs
 * and newlines, so `/\t/evil.com` would otherwise become `//evil.com`. Anything off-site falls back to `/`.
 */
export function safeReturnTo(value: string | null | undefined): string {
  const unsafe = (c: string) => c === "\\" || c.charCodeAt(0) < 0x20;
  if (!value || [...value].some(unsafe) || !value.startsWith("/") || value.startsWith("//")) return "/";
  const resolved = new URL(value, PLACEHOLDER_ORIGIN);
  if (resolved.origin !== PLACEHOLDER_ORIGIN) return "/";
  return resolved.pathname + resolved.search + resolved.hash;
}
