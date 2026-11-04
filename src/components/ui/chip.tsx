import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Toggle / suggestion chip. `selected` is announced through aria-pressed. */
export function Chip({ className, selected, type, ...props }: ChipProps) {
  return (
    <button
      type={type ?? "button"}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 shrink-0 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.97] disabled:cursor-default disabled:opacity-45",
        selected
          ? "border-lamp/60 bg-lamp/15 text-lamp"
          : "border-line-strong bg-surface-2 text-ivory-muted hover:border-ivory-faint hover:text-ivory",
        className,
      )}
      {...props}
    />
  );
}
