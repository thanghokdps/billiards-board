import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface FilterLinksProps {
  /** Accessible name of the group, e.g. "Khoảng thời gian". */
  label: string;
  options: { value: string; label: string; href: string }[];
  current: string;
  className?: string;
}

/** Server-rendered segmented filter: each option is a link to the same page with its query param. */
export function FilterLinks({ label, options, current, className }: FilterLinksProps) {
  return (
    <nav aria-label={label} className={cn("no-scrollbar -mx-4 overflow-x-auto px-4", className)}>
      <ul className="flex w-max gap-1 rounded-full border border-line bg-surface p-1">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <li key={o.value}>
              <Link
                href={o.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-full px-3.5 text-sm font-semibold transition-colors",
                  active ? "bg-lamp text-night" : "text-ivory-muted hover:text-ivory",
                )}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
