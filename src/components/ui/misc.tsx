import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Ball } from "./ball";

export function PageHeader({
  title,
  kicker,
  actions,
  className,
}: {
  title: string;
  kicker?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {kicker && <p className="font-display text-xs font-semibold uppercase tracking-label text-lamp">{kicker}</p>}
        <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-wide sm:text-4xl">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-2xs font-semibold uppercase tracking-label text-ivory-faint">{label}</p>
      <p className={cn("digits text-3xl font-bold leading-tight", accent ? "text-lamp digits-glow" : "text-ivory")}>
        {value}
      </p>
      {hint && <p className="truncate text-xs text-ivory-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      <Ball className="mb-3 size-12 opacity-80" />
      <p className="font-display text-lg font-bold uppercase tracking-wide">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-ivory-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** "Bi lăn" loader: a ball rolling across a felt strip. */
export function BallLoader({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 py-8", className)}>
      <div className="felt relative h-10 w-40 overflow-hidden rounded-full">
        <span className="absolute inset-y-0 left-1/2 flex w-10 -translate-x-1/2 items-center animate-roll">
          <Ball color="var(--color-lamp)" number={1} className="size-8" />
        </span>
      </div>
      <span className="text-sm text-ivory-muted">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}
