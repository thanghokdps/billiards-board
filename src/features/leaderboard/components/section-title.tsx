import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Same look as CardTitle, but an h2: the page title is the h1 and card titles would skip a level. */
export function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-display text-sm font-semibold uppercase tracking-label text-ivory-muted", className)}
      {...props}
    />
  );
}
