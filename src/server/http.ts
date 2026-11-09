import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/server/auth/session";

export type ErrorCode =
  "invalid_body" | "unauthenticated" | "not_found" | "conflict" | "too_large" | "rate_limited" | "internal";

const STATUS: Record<ErrorCode, number> = {
  invalid_body: 400,
  unauthenticated: 401,
  not_found: 404,
  conflict: 409,
  too_large: 413,
  rate_limited: 429,
  internal: 500,
};

/** One field problem of an `invalid_body`, in the shape a form maps back onto its inputs. */
export interface FieldIssue {
  path: (string | number)[];
  message: string;
}

export class HttpError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly extra: { issues?: FieldIssue[]; retryAfter?: number } = {},
  ) {
    super(message ?? code);
  }
}

export function issuesOf(error: z.ZodError): FieldIssue[] {
  return error.issues.map((i) => ({
    path: i.path.map((p) => (typeof p === "number" ? p : String(p))),
    message: i.message,
  }));
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** One wrapper per route: maps thrown errors to `{ error: code }` with the right status, never a stack trace. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        const { issues, retryAfter } = error.extra;
        return NextResponse.json(
          { error: error.code, ...(issues && { issues }) },
          { status: STATUS[error.code], ...(retryAfter && { headers: { "retry-after": String(retryAfter) } }) },
        );
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A uuid path segment, or 404. */
export function uuidParam(value: string): string {
  if (!UUID.test(value)) throw new HttpError("not_found");
  return value;
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
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    throw new HttpError("invalid_body", message, { issues: issuesOf(parsed.error) });
  }
  return parsed.data;
}
