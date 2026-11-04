"use client";

import { createContext, useContext } from "react";

/** Sends a message as the admin (chips, mic). Provided by the chat panel. */
export const SendContext = createContext<(text: string) => void>(() => {});

export function useSend(): (text: string) => void {
  return useContext(SendContext);
}
