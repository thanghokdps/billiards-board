import { cn } from "@/lib/cn";
import type { Point } from "@/lib/table-3d/table-scene";

interface SeatSlotProps {
  point: Point;
  label: string;
  /** The letter or number chalked in the ring. */
  mark: string;
  targeted: boolean;
  flagged: boolean;
  live: boolean;
  disabled: boolean;
  onPick: () => void;
}

/** A chalk ring where a ball will sit. Tapping it chooses which seat the next ball rolls to. */
export function SeatSlot({ point, label, mark, targeted, flagged, live, disabled, onPick }: SeatSlotProps) {
  return (
    <button
      type="button"
      data-pocket
      data-tall={`${point.x},${point.y}`}
      aria-label={label}
      aria-pressed={targeted}
      disabled={disabled}
      onClick={onPick}
      className={cn(
        "absolute -mt-6 -ml-6 size-12 cursor-pointer rounded-full",
        live ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)" : "top-(--y) left-(--x)",
      )}
      style={{ ["--x" as string]: `${point.x}%`, ["--y" as string]: `${point.y}%` }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed font-display text-lg font-bold transition-colors",
          flagged
            ? "border-loss text-loss"
            : targeted
              ? "border-lamp bg-lamp/15 text-lamp"
              : "border-chalk/70 text-chalk",
        )}
      >
        {mark}
      </span>
    </button>
  );
}
