import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server HTML and until hydration. A tap before React's root exists is lost (reproduced with delayed JS;
 * taps after that are replayed), so controls render disabled for that window instead of silently ignoring the tap.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
