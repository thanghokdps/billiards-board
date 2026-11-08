import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False in the server HTML and until hydration: a tap before React attaches is lost, so controls start disabled. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
