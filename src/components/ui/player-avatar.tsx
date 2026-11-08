import { Flame, Snowflake } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

export interface Streak {
  result: "W" | "L";
  length: number;
}

const SIZES = {
  xs: { box: "size-6", text: "text-2xs", badge: "-right-1 -top-1 text-xs" },
  sm: { box: "size-9", text: "text-sm", badge: "-right-1 -top-1 text-sm" },
  md: { box: "size-12", text: "text-lg", badge: "-right-1 -top-1.5 text-base" },
  lg: { box: "size-16", text: "text-2xl", badge: "-right-1 -top-2 text-xl" },
  xl: { box: "size-28", text: "text-5xl", badge: "-right-1 -top-2 text-3xl" },
} as const;

interface PlayerAvatarProps {
  player: Pick<PlayerRef, "name" | "ballColor" | "ballNumber" | "avatarUrl"> & { guest?: boolean };
  size?: keyof typeof SIZES;
  /** A flame after 3 wins in a row; after losses the avatar greys out, and wears the chicken hat from 3. */
  streak?: Streak | null;
  className?: string;
}

/** Losses in a row fade the colour: 1 → 20 %, 2 → 45 %, 3+ → 75 % grey. */
function greyFor(streak: Streak | null | undefined): number {
  if (!streak || streak.result !== "L") return 0;
  return Math.min(0.75, [0, 0.2, 0.45][streak.length] ?? 0.75);
}

export function PlayerAvatar({ player, size = "md", streak, className }: PlayerAvatarProps) {
  const s = SIZES[size];
  const hot = streak?.result === "W" && streak.length >= 3;
  const chicken = streak?.result === "L" && streak.length >= 3;
  const grey = greyFor(streak);
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "ball-roll relative inline-flex items-center justify-center overflow-hidden rounded-full ring-2",
          s.box,
        )}
        style={{ ["--tw-ring-color" as string]: player.ballColor, filter: grey ? `grayscale(${grey})` : undefined }}
      >
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt="" fill sizes="112px" className="object-cover" unoptimized />
        ) : (
          <CartoonBall
            color={player.ballColor}
            initial={player.guest ? "G" : player.name.slice(0, 1)}
            guest={player.guest}
            className={s.text}
          />
        )}
      </span>
      {(hot || chicken) && (
        <span aria-hidden className={cn("absolute drop-shadow", s.badge)}>
          {hot ? <Flame size="1em" className="fill-lamp text-ball" /> : "🐔"}
        </span>
      )}
      {streak && streak.result === "L" && streak.length >= 2 && !chicken && (
        <span aria-hidden className={cn("absolute drop-shadow", s.badge)}>
          <Snowflake size="1em" className="text-cold" />
        </span>
      )}
    </span>
  );
}

/** The "cartoon" avatar: the player's ball, their initial in the ivory disc. */
function CartoonBall({
  color,
  initial,
  guest,
  className,
}: {
  color: string;
  initial: string;
  guest?: boolean;
  className: string;
}) {
  const shine = "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.5), transparent 38%)";
  // A guest's house ball: grey body, a stripe in their ball colour (data), a G in the disc.
  const stripe = `linear-gradient(transparent 28%, color-mix(in srgb, var(--color-ivory) 40%, ${color}) 28% 72%, transparent 72%)`;
  return (
    <span
      className="flex size-full items-center justify-center"
      style={{ background: guest ? `${shine}, ${stripe}, var(--color-house)` : `${shine}, ${color}` }}
    >
      <span
        className={cn(
          "flex aspect-square w-[58%] items-center justify-center rounded-full bg-ivory font-display font-bold uppercase text-night",
          className,
        )}
      >
        {initial}
      </span>
    </span>
  );
}
