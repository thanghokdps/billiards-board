import "server-only";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;
const FAILURE_DELAY_MS = 800;

// shortcut: per-instance memory, so each serverless instance counts on its own; move to a DB or Redis counter if the login sees real abuse.
const failures = new Map<string, { count: number; since: number }>();

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Seconds until this client may try again, or 0. */
export function retryAfter(key: string, now = Date.now()): number {
  const entry = failures.get(key);
  if (!entry || now - entry.since > WINDOW_MS) return 0;
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.since + WINDOW_MS - now) / 1000) : 0;
}

/** Records a wrong password and slows the reply, so guessing costs time even under the cap. */
export async function recordFailure(key: string, now = Date.now()): Promise<void> {
  const entry = failures.get(key);
  failures.set(
    key,
    entry && now - entry.since <= WINDOW_MS ? { count: entry.count + 1, since: entry.since } : { count: 1, since: now },
  );
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
