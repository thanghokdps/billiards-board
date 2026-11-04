"use client";

import { createContext, useContext } from "react";

export interface ChatControls {
  /** True only for the signed-in admin; viewers have no chat. */
  available: boolean;
  isOpen: boolean;
  /** Opens the sheet; with `message`, sends it (default) or only puts it in the input to finish typing. */
  open: (message?: string, mode?: "send" | "prefill") => void;
  close: () => void;
}

export interface PendingChatMessage {
  /** Distinguishes two identical requests in a row. */
  id: number;
  text: string;
  mode: "send" | "prefill";
}

export const ChatContext = createContext<ChatControls>({
  available: false,
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useChat(): ChatControls {
  return useContext(ChatContext);
}
