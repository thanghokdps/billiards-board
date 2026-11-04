/**
 * Outcome of each confirm card, keyed by toolCallId. Lives above the card components so a re-render
 * or remount of the message list never shows Save again for a card that was already saved.
 */
export type CardState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "done"; at: number; undo: (() => Promise<void>) | null }
  | { phase: "undone" }
  | { phase: "cancelled" }
  | { phase: "failed"; reason: string };

const states = new Map<string, CardState>();
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

export function subscribeCards(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const UNDO_WINDOW_MS = 30_000;
