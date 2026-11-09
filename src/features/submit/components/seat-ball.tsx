import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";

import { isNewGuest } from "../lib/draft";
import type { PlacedBall } from "../lib/table-balls";

interface SeatBallProps {
  ball: PlacedBall;
  label: string;
  /** The WebGL table draws this ball, so the button only sits on it. */
  live: boolean;
  /** The potted ball has left the felt: nothing to tap. */
  gone: boolean;
  disabled: boolean;
  /** The server named this seat. */
  flagged: boolean;
  onPick: () => void;
}

/** One player on the felt. It is the real control: the 3D ball under it is only a picture. */
export function SeatBall({ ball, label, live, gone, disabled, flagged, onPick }: SeatBallProps) {
  const t = useTranslations("submit.table");
  const { person, point, potted, won } = ball;
  return (
    <button
      type="button"
      data-ball={person.id}
      aria-label={label}
      disabled={disabled || gone}
      onClick={onPick}
      className={cn(
        "absolute -mt-6 -ml-6 size-12 cursor-pointer rounded-full disabled:cursor-default",
        live
          ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)"
          : "top-(--y) left-(--x) transition-[left,top,scale,opacity] duration-700 ease-[cubic-bezier(0.2,1.15,0.35,1)] motion-reduce:transition-none",
        potted && !live && gone && "scale-50 opacity-0",
        gone && live && "opacity-0",
        flagged && "outline-2 outline-offset-4 outline-loss",
      )}
      style={{ ["--x" as string]: `${point.x}%`, ["--y" as string]: `${point.y}%` }}
    >
      <PlayerAvatar
        player={person}
        size="md"
        className={cn("shadow-card transition-opacity duration-500", live && "opacity-0")}
      />
      {won && <span aria-hidden className="absolute -inset-1 rounded-full ring-3 ring-lamp" />}
      {isNewGuest(person.id) && (
        <span
          aria-hidden
          className="absolute -top-1 -right-3 rounded-full border border-dashed border-chalk bg-night px-1.5 py-0.5 text-2xs leading-none font-semibold text-chalk"
        >
          {t("new")}
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-full left-1/2 mt-0.5 w-16 -translate-x-1/2 truncate text-center text-2xs leading-tight font-semibold text-ivory [text-shadow:0_1px_2px_rgb(0_0_0/0.8)] transition-opacity",
          potted && "opacity-0",
        )}
      >
        {person.name}
      </span>
    </button>
  );
}
