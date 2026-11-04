"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void): () => void {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

// Whole seconds keep the snapshot stable between ticks.
const readSecond = () => Math.floor(Date.now() / 1000) * 1000;
const serverSecond = () => 0;

/** The current time, ticking every second; null on the server and during hydration, so markup never mismatches. */
export function useClock(): Date | null {
  const ms = useSyncExternalStore(subscribe, readSecond, serverSecond);
  return ms === 0 ? null : new Date(ms);
}
