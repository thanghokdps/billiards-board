"use client";

import { MessageCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useChat } from "@/features/shell";

interface ChatButtonProps extends Pick<ButtonProps, "variant" | "size"> {
  label: string;
  /** With text, the chat opens with it in the composer to finish typing; without, it just opens. */
  prefill?: string;
}

export function ChatButton({ label, prefill, variant = "outline", size = "sm" }: ChatButtonProps) {
  const chat = useChat();
  return (
    <Button variant={variant} size={size} onClick={() => (prefill ? chat.open(prefill, "prefill") : chat.open())}>
      <MessageCircle className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
