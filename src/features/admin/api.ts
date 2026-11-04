import { adminCall, AdminApiError } from "@/features/matches";
import type { PlayerInput } from "@/server/players/schema";

/** The login call with its own error type: a 429 carries `retry-after`, which `adminCall` does not expose. */
export class LoginError extends Error {
  constructor(
    readonly code: string,
    readonly retryAfterSeconds: number | null,
  ) {
    super(code);
  }
}

export async function login(password: string): Promise<void> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => ({}));
  const code =
    typeof body === "object" && body && "error" in body ? String((body as { error: unknown }).error) : "internal";
  const retryAfter = Number(response.headers.get("retry-after"));
  throw new LoginError(
    response.status === 429 ? "rate_limited" : code,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  );
}

export type AdminErrorKey = "unauthenticated" | "invalid_body" | "conflict" | "not_found" | "internal";

const KNOWN: readonly string[] = ["unauthenticated", "invalid_body", "conflict", "not_found"];

/** The message key for a failed admin call; anything unexpected is `internal`. */
export function adminErrorKey(error: unknown): AdminErrorKey {
  return error instanceof AdminApiError && KNOWN.includes(error.code) ? (error.code as AdminErrorKey) : "internal";
}

const post = (url: string, body?: unknown) =>
  adminCall<Record<string, unknown>>(url, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const adminApi = {
  logout: () => post("/api/admin/logout"),
  createPlayer: (input: PlayerInput) => post("/api/admin/players", input),
  updatePlayer: (id: number, input: PlayerInput) =>
    adminCall<Record<string, unknown>>(`/api/admin/players/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deletePlayer: (id: number) => adminCall<{ archived: boolean }>(`/api/admin/players/${id}`, { method: "DELETE" }),
  /** Multipart upload (field `file`); `adminCall` leaves the content type to the browser for FormData. */
  uploadAvatar: async (file: File): Promise<string> => {
    const form = new FormData();
    form.set("file", file);
    return (await adminCall<{ id: string; url: string }>("/api/admin/media", { method: "POST", body: form })).url;
  },
};
