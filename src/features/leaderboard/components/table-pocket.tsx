import { cn } from "@/lib/cn";

import type { PocketLine } from "../lib/pocket-layout";

interface TablePocketProps {
  label: string;
  tall: PocketLine;
  wide: PocketLine;
  active: boolean;
  live: boolean;
  onPick: () => void;
}

/** A hole in the felt that ranks the balls by one stat. */
export function TablePocket({ label, tall, wide, active, live, onPick }: TablePocketProps) {
  return (
    <button
      type="button"
      data-pocket
      data-tall={`${tall.from.x},${tall.from.y}`}
      data-wide={`${wide.from.x},${wide.from.y}`}
      aria-pressed={active}
      onClick={onPick}
      className={cn(
        "absolute -mt-5.5 -ml-5.5 size-11 cursor-pointer rounded-full",
        live
          ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)"
          : "top-(--y-tall) left-(--x-tall) @xl:top-(--y-wide) @xl:left-(--x-wide)",
      )}
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
          "absolute inset-1.5 rounded-full border-3 transition-colors",
          !live && "bg-night",
          active ? "border-lamp" : live ? "border-transparent" : "border-night",
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
