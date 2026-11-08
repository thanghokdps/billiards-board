import type { SubmissionInput } from "@/server/submissions/schema";

import type { ServerIssue } from "./lib/issues";

/** A failed submit: `code` is the API's stable error code; a 429 carries how long to wait. */
export class SubmitError extends Error {
  constructor(
    readonly code: string,
    readonly issues: ServerIssue[] = [],
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(code);
  }
}

const isIssue = (value: unknown): value is ServerIssue =>
  typeof value === "object" && value !== null && Array.isArray((value as { path?: unknown }).path);

/** The public POST. A filled honeypot answers 200 and stores nothing, which looks the same to the sender. */
export async function postSubmission(input: SubmissionInput, website: string): Promise<void> {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...input, website }),
  });
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => ({}));
  const record = typeof body === "object" && body ? (body as { error?: unknown; issues?: unknown }) : {};
  const retryAfter = Number(response.headers.get("retry-after"));
  throw new SubmitError(
    typeof record.error === "string" ? record.error : "internal",
    Array.isArray(record.issues) ? record.issues.filter(isIssue) : [],
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  );
}
