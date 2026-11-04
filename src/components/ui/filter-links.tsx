import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface FilterLinksProps {
  /** Accessible name of the group, e.g. "Khoảng thời gian". */
  label: string;
  options: { value: string; label: string; href: string }[];
  current: string;
  className?: string;
}

/** The score wire of a billiard club: each option is a stop on a brass wire and a ball rolls to the chosen one. */
export function FilterLinks({ label, options, current, className }: FilterLinksProps) {
  const stop = options.findIndex((o) => o.value === current);
  return (
    <nav aria-label={label} className={cn("no-scrollbar -mx-4 overflow-x-auto px-4", className)}>
      <div
        className="score-wire relative w-max min-w-full sm:min-w-0"
        style={{ ["--stops" as string]: options.length, ["--stop" as string]: Math.max(stop, 0) }}
      >
        <ul className="grid auto-cols-fr grid-flow-col">
          {options.map((o) => {
            const active = o.value === current;
            return (
              <li key={o.value}>
                <Link
                  href={o.href}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "score-stop flex h-13 items-end justify-center rounded-sm px-1 pb-1 font-display text-sm font-semibold whitespace-nowrap uppercase transition-colors sm:px-2.5 sm:text-base sm:tracking-wide",
                    active ? "text-lamp digits-glow" : "text-ivory-muted hover:text-ivory",
                  )}
                >
                  {o.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {stop >= 0 && (
          <span aria-hidden className="score-carrier">
            <span className="score-bead">
              <span className="score-spot" />
            </span>
          </span>
        )}
      </div>
    </nav>
  );
}
