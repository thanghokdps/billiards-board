"use client";

import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

import { haptic } from "@/lib/feedback";

const LONG_PRESS_MS = 450;

/**
 * Pointer-event long press. Spread `handlers` on the element and call `wasLongPress()` first in its click
 * handler: the click that follows a long press must not also count as a tap.
 */
export function useLongPress(onLongPress: () => void, ms: number = LONG_PRESS_MS) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(() => {
    fired.current = false;
    cancel();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      fired.current = true;
      haptic(25);
      onLongPress();
    }, ms);
  }, [cancel, ms, onLongPress]);

  const wasLongPress = useCallback(() => {
    const result = fired.current;
    fired.current = false;
    return result;
  }, []);

  return {
    wasLongPress,
    handlers: {
      onPointerDown: (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        start();
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      // Touch browsers open a context menu on long press; the press already means "victim".
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    },
  };
}
