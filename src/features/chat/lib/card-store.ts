/**
 * Outcome of each confirm card, keyed by toolCallId. Lives above the card components so a re-render
 * or remount of the message list never shows Save again for a card that was already saved.
 */
import type { CardDecision } from "@/lib/agent-results";

/** New per page load: a chat decision replayed after a reload names an older page and is ignored. */
export const CHAT_PAGE_ID = crypto.randomUUID();

export type CardState =
  | { phase: "idle" }
  // Confirmed in chat; the mounted card runs the same save as its button.
  | { phase: "requested" }
  | { phase: "saving" }
  | { phase: "done"; at: number; undo: (() => Promise<void>) | null }
  | { phase: "undone" }
  | { phase: "cancelled" }
  | { phase: "superseded" }
  | { phase: "failed"; reason: string };

const states = new Map<string, CardState>();
const appliedDecisions = new Set<string>();
const listeners = new Set<() => void>();
// One shared object: useSyncExternalStore loops forever if the snapshot is a new object on every read.
const IDLE: CardState = { phase: "idle" };

export function getCardState(id: string): CardState {
  return states.get(id) ?? IDLE;
}

export function setCardState(id: string, state: CardState): void {
  states.set(id, state);
  listeners.forEach((l) => l());
}

const isOpen = ({ phase }: CardState) => phase === "idle" || phase === "failed";

/** Makes a rendered card count as open: a card nobody touched has no entry otherwise. */
export function registerCard(id: string): void {
  if (!states.has(id)) setCardState(id, IDLE);
}

export function supersedeCards(ids: string[]): void {
  for (const id of ids) if (isOpen(getCardState(id))) setCardState(id, { phase: "superseded" });
}

/** A string, so it is a stable useSyncExternalStore snapshot. */
export function getOpenCardIds(): string {
  return [...states]
    .filter(([, state]) => isOpen(state))
    .map(([id]) => id)
    .join(",");
}

/** A chat answer acts like the card's button, once per tool call: the message list remounts with the sheet. */
export function applyCardDecision(
  toolCallId: string,
  { cardIds, decision, pageId }: Pick<CardDecision, "cardIds" | "decision" | "pageId">,
): void {
  if (pageId !== CHAT_PAGE_ID || appliedDecisions.has(toolCallId)) return;
  appliedDecisions.add(toolCallId);
  for (const id of cardIds) {
    if (isOpen(getCardState(id))) setCardState(id, { phase: decision === "confirm" ? "requested" : "cancelled" });
  }
}

export function subscribeCards(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const UNDO_WINDOW_MS = 30_000;
