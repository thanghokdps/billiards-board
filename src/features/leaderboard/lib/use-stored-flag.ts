"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
// Kept when localStorage is blocked (private mode), so the toggle still works for this visit.
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** A boolean remembered in localStorage; the server render and the first paint use `fallback`. */
export function useStoredFlag(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback(
    (next: boolean) => {
      memory.set(key, next ? "1" : "0");
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // storage blocked or full: the in-memory copy above carries the choice
      }
      listeners.forEach((notify) => notify());
    },
    [key],
  );
  return [raw === null ? fallback : raw === "1", set];
}
