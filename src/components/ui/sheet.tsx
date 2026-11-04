"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Visually hidden title still names the dialog for screen readers. */
  hideTitle?: boolean;
  /** `responsive`: bottom sheet below `md`, side panel from `md` up. */
  side?: "bottom" | "right" | "responsive";
  className?: string;
  children: ReactNode;
}

/** Bottom sheet on phones, side panel on desktop (`side="right"`), with focus trap and Esc to close. */
export function Sheet({ open, onOpenChange, title, hideTitle, side = "bottom", className, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-fade fixed inset-0 z-50 bg-night/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col border-line-strong bg-surface shadow-pop outline-none",
            side === "bottom" && "sheet-up inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl border-t",
            side === "right" && "sheet-left inset-y-0 right-0 w-full max-w-md border-l",
            side === "responsive" &&
              "sheet-responsive inset-x-0 bottom-0 h-[92dvh] rounded-t-xl border-t md:inset-x-auto md:inset-y-0 md:right-0 md:h-auto md:w-full md:max-w-lg md:rounded-none md:border-t-0 md:border-l",
            className,
          )}
        >
          {side !== "right" && (
            <div
              aria-hidden
              className={cn(
                "mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-line-strong",
                side === "responsive" && "md:hidden",
              )}
            />
          )}
          <Dialog.Title
            className={cn("px-5 pt-3 font-display text-lg font-bold uppercase tracking-wide", hideTitle && "sr-only")}
          >
            {title}
          </Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const SheetClose = Dialog.Close;
