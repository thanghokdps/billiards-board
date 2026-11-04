import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { PlayerStats } from "@/lib/stats";

import { tagPlacement, type PocketLine, type Point } from "../lib/pocket-layout";

interface TableBallProps {
  stats: PlayerStats;
  label: string;
  value: string;
  tall: Point;
  wide: Point;
  tallLine: PocketLine;
  wideLine: PocketLine;
  rank: number;
  showTag: boolean;
  selected: boolean;
  /** The WebGL table is drawing this ball, so this button only sits on it. */
  live: boolean;
  onPick: () => void;
}

/** One player rolling over the felt; left and top animate so the same ball travels between stats. */
export function TableBall({
  stats,
  label,
  value,
  tall,
  wide,
  tallLine,
  wideLine,
  rank,
  showTag,
  selected,
  live,
  onPick,
}: TableBallProps) {
  const tagTall = tagPlacement(tallLine, tall);
  const tagWide = tagPlacement(wideLine, wide);
  return (
    <button
      type="button"
      data-ball={stats.player.id}
      aria-label={label}
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        "absolute -mt-6 -ml-6 size-12 cursor-pointer rounded-full",
        live
          ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)"
          : "top-(--y-tall) left-(--x-tall) transition-[left,top] duration-700 ease-[cubic-bezier(0.2,1.15,0.35,1)] motion-reduce:transition-none @xl:top-(--y-wide) @xl:left-(--x-wide)",
        selected && "outline-2 outline-offset-4 outline-ivory",
      )}
      style={{
        transitionDelay: `${rank * 60}ms`,
        ["--x-tall" as string]: `${tall.x}%`,
        ["--y-tall" as string]: `${tall.y}%`,
        ["--x-wide" as string]: `${wide.x}%`,
        ["--y-wide" as string]: `${wide.y}%`,
        ["--tag-tall" as string]: tagTall.transform,
        ["--tag-wide" as string]: tagWide.transform,
        ["--align-tall" as string]: tagTall.align,
        ["--align-wide" as string]: tagWide.align,
      }}
    >
      <PlayerAvatar
        player={stats.player}
        size="md"
        streak={stats.current}
        className={cn("shadow-card transition-opacity duration-500", live && "opacity-0")}
      />
      {rank === 0 && showTag && <span aria-hidden className="absolute -inset-1 rounded-full ring-3 ring-lamp" />}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-1/2 z-10 text-xs leading-tight font-semibold whitespace-nowrap text-ivory transition-opacity [text-align:var(--align-tall)] [text-shadow:0_1px_2px_rgb(0_0_0/0.7)] transform-(--tag-tall) @xl:[text-align:var(--align-wide)] @xl:transform-(--tag-wide)",
          showTag ? "opacity-100" : "opacity-0",
        )}
      >
        {stats.player.name}
        <strong className="block digits text-xl font-bold text-lamp">{value}</strong>
      </span>
    </button>
  );
}
