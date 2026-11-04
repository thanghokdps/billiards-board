import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/server/auth/session";

export type ErrorCode = "invalid_body" | "unauthenticated" | "not_found" | "conflict" | "internal";

const STATUS: Record<ErrorCode, number> = {
  invalid_body: 400,
  unauthenticated: 401,
  not_found: 404,
  conflict: 409,
  internal: 500,
};

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** One wrapper per route: maps thrown errors to `{ error: code }` with the right status, never a stack trace. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.code }, { status: STATUS[error.code] });
      }
      console.error(`[api] ${new URL(request.url).pathname}:`, error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "internal" }, { status: 500 });
    }
  };
}

/** Admin-only routes: 401 unless the signed admin cookie verifies. */
export async function requireAdmin(request: Request): Promise<{ actor: string }> {
  if (!(await isAdminRequest(request))) throw new HttpError("unauthenticated");
  return { actor: "admin" };
}

/** A positive integer path segment, or 404 (a malformed id is never a 500). */
export function intParam(value: string): number {
  if (!/^\d{1,9}$/.test(value)) throw new HttpError("not_found");
  return Number(value);
}

/** `?via=chat` marks writes made from the chat confirm card in the audit log. */
export function viaOf(request: Request): "chat" | "ui" {
  return new URL(request.url).searchParams.get("via") === "chat" ? "chat" : "ui";
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError("invalid_body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError("invalid_body", parsed.error.issues.map((i) => i.message).join("; "));
  return parsed.data;
}
