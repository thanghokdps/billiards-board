import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** Small drawn billiards scenes, moved by CSS (`.art-*` in globals.css). All decoration: hidden from screen readers. */

/** A cue strikes the white, the white kisses the 8, the 8 drops in the pocket. */
export function CueShot({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 64" className={cn("art h-14 w-auto sm:h-20", className)}>
      <path d="M0 53h200" className="art-baize" />
      <ellipse cx="184" cy="52" rx="14" ry="5" className="art-hole" />
      <g className="art-eight">
        <circle cx="122" cy="41" r="10" className="art-ball-black" />
        <circle cx="122" cy="41" r="4.5" className="art-ball-ivory" />
      </g>
      <circle cx="52" cy="41" r="10" className="art-ball-ivory art-white" />
      <path d="M-80 37.5 36 40v2L-80 44.5Z" className="art-cue" />
    </svg>
  );
}

const RACK_COLORS = ["lamp", "wood", "loss", "win", "ivory"];
const RACK_ROWS = 5;
const BALL_GAP = 15;
const BREAK_SPREAD = 0.55;

/** Fifteen balls in the triangle; a hover (on touch screens, a loop) breaks the rack. */
export function RackBreak({ className }: { className?: string }) {
  const balls = Array.from({ length: RACK_ROWS }).flatMap((_, row) =>
    Array.from({ length: row + 1 }, (_, slot) => {
      const x = (slot - row / 2) * BALL_GAP;
      const y = row * BALL_GAP * 0.87 - 24;
      return { x, y, color: RACK_COLORS[(row * 2 + slot) % RACK_COLORS.length] };
    }),
  );
  return (
    <svg aria-hidden viewBox="-60 -44 120 88" className={cn("art art-rack h-16 w-auto sm:h-24", className)}>
      <path d="M0-38 42 34H-42Z" className="art-rack-frame" />
      {balls.map(({ x, y, color }) => (
        <circle
          key={`${x}:${y}`}
          cx={x}
          cy={y}
          r="7"
          fill={`var(--color-${color})`}
          style={{ "--break-x": `${x * BREAK_SPREAD}px`, "--break-y": `${y * BREAK_SPREAD}px` } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** The billiard lamp, swinging a little on its cord. */
export function SwingLamp({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 92" className={cn("art h-16 w-auto sm:h-24", className)}>
      <defs>
        <linearGradient id="art-lamp-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-lamp)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-lamp)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="art-lamp">
        <path d="M60 0v22" className="art-cord" />
        <path d="M40 40 16 92h88L80 40Z" fill="url(#art-lamp-light)" />
        <path d="M52 22h16l14 18H38Z" className="art-shade" />
        <ellipse cx="60" cy="41" rx="9" ry="3" className="art-bulb" />
      </g>
    </svg>
  );
}

/** A cube of chalk shedding dust. */
export function ChalkCube({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 72" className={cn("art size-14", className)}>
      <path d="M32 4 56 16 32 28 8 16Z" className="art-chalk-top" />
      <path d="M8 16 32 28v26L8 42Z" className="art-chalk-left" />
      <path d="M56 16 32 28v26l24-12Z" className="art-chalk-right" />
      <ellipse cx="32" cy="16" rx="11" ry="5" className="art-chalk-dent" />
      {[20, 32, 44].map((x) => (
        <rect key={x} x={x} y="56" width="2" height="2" className="art-dust" />
      ))}
    </svg>
  );
}
