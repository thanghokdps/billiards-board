import type { ScheduleInput, SubmissionInput, TempMatchView } from "@/server/submissions/schema";

export interface ApiIssue {
  path: (string | number)[];
  message: string;
}

/** A failed member call: `code` is the API's stable error code; `invalid_body` also carries the field issues. */
export class MemberApiError extends Error {
  constructor(
    readonly code: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(code);
  }
}

const MEMBER_ERRORS = ["busy", "conflict", "not_found", "unauthenticated", "invalid_body", "too_large"] as const;
export type MemberErrorKey = (typeof MEMBER_ERRORS)[number] | "failed";

/** The `submit.errors` message key for an API error code; anything unexpected is `failed`. */
export function memberErrorKey(code: string): MemberErrorKey {
  return MEMBER_ERRORS.find((known) => known === code) ?? "failed";
}

const isIssue = (value: unknown): value is ApiIssue =>
  typeof value === "object" && value !== null && Array.isArray((value as { path?: unknown }).path);

async function call<T>(url: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const parsed: unknown = await response.json().catch(() => ({}));
  if (response.ok) return parsed as T;
  const record = typeof parsed === "object" && parsed ? (parsed as { error?: unknown; issues?: unknown }) : {};
  throw new MemberApiError(
    typeof record.error === "string" ? record.error : "internal",
    Array.isArray(record.issues) ? record.issues.filter(isIssue) : [],
  );
}

/** The signed-in member's own temp matches: schedule now, enter the result later. */
export const memberMatchesApi = {
  create: (input: ScheduleInput) => call<{ match: TempMatchView }>("/api/my/matches", "POST", input),
  edit: (id: string, input: ScheduleInput) => call<{ match: TempMatchView }>(`/api/my/matches/${id}`, "PATCH", input),
  result: (id: string, input: SubmissionInput) =>
    call<{ match: TempMatchView }>(`/api/my/matches/${id}/result`, "POST", input),
  cancel: (id: string) => call<{ ok: true }>(`/api/my/matches/${id}/cancel`, "POST"),
};
