import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getServerEnv } from "@/server/env";

export const ADMIN_COOKIE = "anbill_admin";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function sign(payload: string): string {
  return createHmac("sha256", getServerEnv().SESSION_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** `<expiresAtSeconds>.<hmac>` — no user data, only proof that the admin password was entered. */
export function createSessionToken(now = Date.now()): string {
  const expires = String(Math.floor(now / 1000) + MAX_AGE_SECONDS);
  return `${expires}.${sign(`admin:${expires}`)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || !/^\d+$/.test(expires)) return false;
  if (Number(expires) * 1000 < now) return false;
  return safeEqual(mac, sign(`admin:${expires}`));
}

export function passwordMatches(given: string): boolean {
  const expected = getServerEnv().ADMIN_PASSWORD;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(`pw:${given}`), sign(`pw:${expected}`));
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** For route handlers (the chat runtime, admin APIs). */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  return verifySessionToken(match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : undefined);
}

/** For server components and server actions. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
