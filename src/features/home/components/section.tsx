import { useId, type ReactNode } from "react";

/** A named block of a page: an h2 (so headings stay in order under the page's h1) and an optional action beside it. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-2.5 flex min-h-8 items-center justify-between gap-3">
        <h2 id={id} className="font-display text-sm font-semibold uppercase tracking-label text-ivory-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
