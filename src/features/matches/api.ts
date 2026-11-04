import type { MatchEvent } from "@/server/events/types";
import type { MatchInput, MatchPatch, MatchView } from "@/server/matches/schema";

/** A failed admin call: `code` is the API's stable error code (`unauthenticated`, `invalid_body` …). */
export class AdminApiError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : undefined,
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code =
      typeof body === "object" && body && "error" in body ? String((body as { error: unknown }).error) : "internal";
    throw new AdminApiError(code);
  }
  return body as T;
}

const via = (from: "chat" | "ui") => (from === "chat" ? "?via=chat" : "");

export const matchesApi = {
  create: (matches: MatchInput[], from: "chat" | "ui", idempotencyKey?: string) =>
    call<{ matches: MatchView[]; events: MatchEvent[] }>("/api/admin/matches", {
      method: "POST",
      body: JSON.stringify({ matches, via: from, idempotencyKey }),
    }),
  update: (id: string, patch: MatchPatch, from: "chat" | "ui") =>
    call<{ match: MatchView }>(`/api/admin/matches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ patch, via: from }),
    }),
  remove: (id: string, from: "chat" | "ui") =>
    call<{ match: MatchView }>(`/api/admin/matches/${id}${via(from)}`, { method: "DELETE" }),
  restore: (id: string, from: "chat" | "ui") =>
    call<{ match: MatchView }>(`/api/admin/matches/${id}/restore${via(from)}`, { method: "POST" }),
};

/** The patch that puts a match back exactly as `before` (undo of an edit). */
export function revertPatch(before: MatchView): MatchPatch {
  return {
    gameType: before.gameType,
    format: before.format,
    sideA: before.sideA.map((p) => p.id),
    sideB: before.sideB.map((p) => p.id),
    winnerSide: before.winnerSide,
    scoreA: before.scoreA,
    scoreB: before.scoreB,
    bill: before.bill,
    note: before.note,
    tags: before.tags,
  };
}

export { call as adminCall };
