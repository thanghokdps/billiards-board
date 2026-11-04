"use client";

import { useCallback, useEffect, useReducer } from "react";

interface RotationState {
  index: number;
  /** Whole seconds spent on the current board. */
  elapsed: number;
}

type RotationAction = { type: "tick" } | { type: "step"; delta: number };

/** Boards advance every `seconds`; stepping by hand restarts the count for the board you land on. */
export function useRotation(count: number, seconds: number, paused: boolean) {
  const [state, dispatch] = useReducer(
    (current: RotationState, action: RotationAction): RotationState => {
      if (action.type === "step") return { index: (current.index + action.delta + count) % count, elapsed: 0 };
      if (current.elapsed + 1 >= seconds) return { index: (current.index + 1) % count, elapsed: 0 };
      return { ...current, elapsed: current.elapsed + 1 };
    },
    { index: 0, elapsed: 0 },
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  const step = useCallback((delta: number) => dispatch({ type: "step", delta }), []);

  return { index: state.index, progress: (state.elapsed + 1) / seconds, step };
}
