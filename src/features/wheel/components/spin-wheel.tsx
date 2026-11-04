"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { cn } from "@/lib/cn";
import { clack, haptic } from "@/lib/feedback";
import { cryptoRandom, pickWeighted, rotationFor, slicesOf, type Slice, type WheelEntry } from "@/lib/wheel";

const SPIN_MS = 2600;
const R = 140;

// Node and Chrome disagree on the last float digit of cos/sin, which breaks hydration; round SVG coordinates.
const round = (n: number) => Math.round(n * 100) / 100;

function arcPath(slice: Slice): string {
  if (slice.share >= 0.9999) return `M 0 ${-R} A ${R} ${R} 0 1 1 -0.01 ${-R} Z`;
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [round(R * Math.cos(rad)), round(R * Math.sin(rad))] as const;
  };
  const [x1, y1] = toXY(slice.start);
  const [x2, y2] = toXY(slice.end);
  const large = slice.end - slice.start > 180 ? 1 : 0;
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

function labelAt(slice: Slice, radius: number) {
  const mid = (slice.start + slice.end) / 2;
  const rad = ((mid - 90) * Math.PI) / 180;
  return { x: round(radius * Math.cos(rad)), y: round(radius * Math.sin(rad)), rotate: round(mid) };
}

export interface SpinWheelHandle {
  /** Draws the winner with crypto randomness, then animates to it. */
  spin: () => void;
  /** Jumps to the end of a running spin. */
  skip: () => void;
}

interface SpinWheelProps {
  ref?: Ref<SpinWheelHandle>;
  entries: WheelEntry[];
  onResult: (entry: WheelEntry) => void;
  onSpinningChange?: (spinning: boolean) => void;
  percentLabel: (share: number) => string;
  className?: string;
}

/** The felt table seen from above: one slice per player in their ball colour, the cue tip as pointer. */
export function SpinWheel({ ref, entries, onResult, onSpinningChange, percentLabel, className }: SpinWheelProps) {
  const slices = slicesOf(entries);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(SPIN_MS);
  const pending = useRef<WheelEntry | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      spin() {
        const winner = pickWeighted(entries, cryptoRandom);
        if (!winner || pending.current) return;
        pending.current = winner;
        setDuration(SPIN_MS);
        setRotation((current) => rotationFor(slicesOf(entries), winner.id, current));
        onSpinningChange?.(true);
        haptic(10);
      },
      skip() {
        if (pending.current) setDuration(0);
      },
    }),
    [entries, onSpinningChange],
  );

  // A zero-length transition fires no transitionend, so skip finishes here.
  useEffect(() => {
    if (duration !== 0 || !pending.current) return;
    const id = requestAnimationFrame(() => finish());
    return () => cancelAnimationFrame(id);
  });

  function finish() {
    const winner = pending.current;
    if (!winner) return;
    pending.current = null;
    haptic([30, 40, 30]);
    clack(0.7);
    onSpinningChange?.(false);
    onResult(winner);
  }

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-sm", className)}>
      {/* Cue tip pointer at 12 o'clock */}
      <div aria-hidden className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
        <svg viewBox="0 0 24 56" className="h-12 w-6 drop-shadow-lg">
          <rect x="8" y="0" width="8" height="36" rx="2" style={{ fill: "var(--color-ivory-muted)" }} />
          <rect x="8" y="30" width="8" height="8" style={{ fill: "var(--color-cold)" }} />
          <path d="M8 38 L16 38 L12 54 Z" style={{ fill: "var(--color-lamp)" }} />
        </svg>
      </div>
      <svg
        viewBox="-160 -160 320 320"
        className="size-full"
        role="img"
        aria-label={entries.map((e) => e.label).join(", ")}
      >
        {/* Rail and pockets */}
        <circle r="158" style={{ fill: "var(--color-wood)" }} />
        <circle r="150" style={{ fill: "var(--color-felt-deep)" }} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={deg}
            r="6"
            cx={round(154 * Math.cos((deg * Math.PI) / 180))}
            cy={round(154 * Math.sin((deg * Math.PI) / 180))}
            style={{ fill: "var(--color-night)" }}
          />
        ))}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.1, 1)`,
          }}
          onTransitionEnd={finish}
        >
          {slices.map((slice) => {
            const label = labelAt(slice, R * 0.64);
            const pct = labelAt(slice, R * 0.86);
            return (
              <g key={slice.entry.id}>
                <path
                  d={arcPath(slice)}
                  style={{ fill: slice.entry.color, stroke: "var(--color-felt-deep)", strokeWidth: 2 }}
                />
                {slice.share > 0.04 && (
                  <>
                    <text
                      x={label.x}
                      y={label.y}
                      transform={`rotate(${label.rotate} ${label.x} ${label.y})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="800"
                      fontSize={slice.share > 0.12 ? 17 : 12}
                      style={{
                        fill: "var(--color-night)",
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                      }}
                    >
                      {slice.entry.label}
                    </text>
                    <text
                      x={pct.x}
                      y={pct.y}
                      transform={`rotate(${pct.rotate} ${pct.x} ${pct.y})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="700"
                      fontSize="11"
                      style={{ fill: "var(--color-night)", fontFamily: "var(--font-display)", opacity: 0.8 }}
                    >
                      {percentLabel(slice.share)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
        {/* Centre spot */}
        <circle r="22" style={{ fill: "var(--color-felt)", stroke: "var(--color-felt-deep)", strokeWidth: 4 }} />
        <circle r="7" style={{ fill: "var(--color-ivory)" }} />
      </svg>
    </div>
  );
}
