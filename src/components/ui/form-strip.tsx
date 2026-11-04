import { cn } from "@/lib/cn";

/** Last results, newest first, as W/L pills ("phong độ"). */
export function FormStrip({
  form,
  className,
  labels,
}: {
  form: ("W" | "L")[];
  className?: string;
  labels: { W: string; L: string };
}) {
  return (
    <ol className={cn("flex gap-1", className)} aria-label={form.map((r) => labels[r]).join(", ")}>
      {form.map((r, i) => (
        <li
          key={i}
          aria-hidden
          className={cn(
            "flex size-6 items-center justify-center rounded-sm font-display text-xs font-bold",
            r === "W" ? "bg-win/20 text-win" : "bg-loss/15 text-loss",
          )}
        >
          {labels[r].slice(0, 1)}
        </li>
      ))}
    </ol>
  );
}
