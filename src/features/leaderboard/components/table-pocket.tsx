import { cn } from "@/lib/cn";

import type { PocketLine } from "../lib/pocket-layout";

interface TablePocketProps {
  label: string;
  tall: PocketLine;
  wide: PocketLine;
  active: boolean;
  onPick: () => void;
}

/** A hole in the felt that ranks the balls by one stat. */
export function TablePocket({ label, tall, wide, active, onPick }: TablePocketProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPick}
      className="absolute top-(--y-tall) left-(--x-tall) -mt-5.5 -ml-5.5 size-11 cursor-pointer rounded-full @xl:top-(--y-wide) @xl:left-(--x-wide)"
      style={{
        ["--x-tall" as string]: `${tall.from.x}%`,
        ["--y-tall" as string]: `${tall.from.y}%`,
        ["--x-wide" as string]: `${wide.from.x}%`,
        ["--y-wide" as string]: `${wide.from.y}%`,
        ["--label-tall" as string]: tall.label,
        ["--label-wide" as string]: wide.label,
      }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-1.5 rounded-full border-3 bg-night transition-colors",
          active ? "border-lamp" : "border-night",
        )}
      />
      <span
        className={cn(
          "absolute top-1/2 left-1/2 text-xs font-semibold whitespace-nowrap transform-(--label-tall) @xl:transform-(--label-wide)",
          active ? "text-lamp" : "text-ivory",
        )}
      >
        {label}
      </span>
    </button>
  );
}
