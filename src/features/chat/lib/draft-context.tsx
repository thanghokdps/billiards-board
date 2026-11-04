"use client";

import { createContext, useContext } from "react";

/** Text to place in the composer (prefill from the wheel, mic transcript); `nonce` makes a repeat land. */
export interface Draft {
  text: string;
  nonce: number;
}

export const DraftContext = createContext<Draft | null>(null);

export function useDraft(): Draft | null {
  return useContext(DraftContext);
}
