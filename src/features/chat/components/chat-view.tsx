"use client";

import { CopilotChatView, type CopilotChatViewProps } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";

import { useDraft } from "../lib/draft-context";

/**
 * Stock CopilotChatView (L2 slot): CopilotChat owns the composer text, so a draft
 * (wheel prefill, mic transcript) reaches the input only through `onInputChange`.
 */
export function ChatView(props: CopilotChatViewProps) {
  const draft = useDraft();
  const applied = useRef<number | null>(null);
  const { onInputChange } = props;

  useEffect(() => {
    if (!draft || applied.current === draft.nonce) return;
    applied.current = draft.nonce;
    onInputChange?.(draft.text);
  }, [draft, onInputChange]);

  return <CopilotChatView {...props} />;
}
