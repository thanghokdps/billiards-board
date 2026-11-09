import { useCallback, useEffect, useRef, type MouseEvent } from "react";

const HOLD_MS = 400;
const REPEAT_MS = 70;

/**
 * Press once to step, hold to keep stepping. A keyboard "click" (detail 0) steps once; a pointer click is skipped
 * because the press already stepped.
 */
export function useHoldRepeat(step: () => void) {
  const stepRef = useRef(step);
  const timers = useRef<{ hold?: ReturnType<typeof setTimeout>; every?: ReturnType<typeof setInterval> }>({});

  useEffect(() => {
    stepRef.current = step;
  });

  const stop = useCallback(() => {
    clearTimeout(timers.current.hold);
    clearInterval(timers.current.every);
  }, []);
  useEffect(() => stop, [stop]);

  return {
    onPointerDown: () => {
      stepRef.current();
      timers.current.hold = setTimeout(() => {
        timers.current.every = setInterval(() => stepRef.current(), REPEAT_MS);
      }, HOLD_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: (event: MouseEvent) => {
      if (event.detail === 0) stepRef.current();
    },
  };
}
