import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Ball } from "./ball";
import { ChalkCube } from "./billiard-art";

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
        <h1 className="text-balance font-display text-4xl font-extrabold leading-none sm:text-5xl">{title}</h1>
        {kicker && <p className="mt-1.5 text-sm text-ivory-muted">{kicker}</p>}
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
      <p className="truncate text-xs font-medium text-ivory-muted">{label}</p>
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
    <div className={cn("flex flex-col items-center px-6 py-8 text-center", className)}>
      <ChalkCube className="mb-3" />
      <p className="text-balance font-display text-2xl font-bold leading-tight">{title}</p>
      {body && <p className="mt-1.5 max-w-xs text-sm text-ivory-muted">{body}</p>}
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
