import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { TreatPins } from "@/lib/wheel";

const KEY = "anbill.wheel.treat";
const NONE: TreatPins = {};

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Kept in memory too: storage can throw in a private window, and the treat must still work for this visit.
let raw: string | null = null;

function read(): string {
  if (raw !== null) return raw;
  try {
    raw = localStorage.getItem(KEY) ?? "{}";
  } catch {
    raw = "{}";
  }
  return raw;
}

function write(pins: TreatPins) {
  raw = JSON.stringify(pins);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Storage blocked: the pins live until the tab closes.
  }
  listeners.forEach((listener) => listener());
}

function parse(json: string): TreatPins {
  try {
    const value: unknown = JSON.parse(json);
    if (typeof value !== "object" || value === null) return NONE;
    const valid = Object.entries(value).filter(([, share]) => typeof share === "number" && share >= 0 && share <= 1);
    return Object.fromEntries(valid.map(([id, share]) => [Number(id), Number(share)]));
  } catch {
    return NONE;
  }
}

/** The admin's treat, in this browser only and only while `admin`: after a logout the same browser spins fairly. */
export function useTreatPins(admin: boolean): [TreatPins, (pins: TreatPins) => void] {
  const stored = useSyncExternalStore(subscribe, read, () => "{}");
  const pins = useMemo(() => (admin ? parse(stored) : NONE), [admin, stored]);
  const set = useCallback((next: TreatPins) => write(next), []);
  return [pins, set];
}
