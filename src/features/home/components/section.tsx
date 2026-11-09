import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A named block of a page: an h2 (so headings stay in order under the page's h1) and an optional action beside it. */
export function Section({
  title,
  action,
  children,
  className,
  anchor,
}: {
  title: string;
  /** Lets another page link straight to this block (`/#anchor`). */
  anchor?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section id={anchor} aria-labelledby={id} className={cn(anchor && "scroll-mt-24", className)}>
      <div className="mb-2.5 flex min-h-8 items-center justify-between gap-3">
        <h2 id={id} className="font-display text-2xl font-bold leading-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
