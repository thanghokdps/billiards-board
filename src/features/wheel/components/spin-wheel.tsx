"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState, type PointerEvent, type Ref } from "react";

import { cn } from "@/lib/cn";
import { clack, haptic } from "@/lib/feedback";
import {
  cryptoRandom,
  pickWeighted,
  rotationFor,
  slicesOf,
  treatedChances,
  type TreatPins,
  type WheelEntry,
} from "@/lib/wheel";

import { FlatWheel } from "./flat-wheel";
import { WheelCanvas } from "./wheel-canvas";
import type { WheelScene } from "../lib/wheel-scene";

const SPIN_MS = 2600;
/** How long a winner stays on the wheel before it leaves for the next spin. */
const REVEAL_MS = 1700;
const TICK_GAP_MS = 70;

/** The treat changes who wins, never what the wheel shows. */
function draw(entries: WheelEntry[], pins: TreatPins | undefined): WheelEntry | null {
  if (!pins) return pickWeighted(entries, cryptoRandom);
  const chances = treatedChances(entries, pins);
  const drawn = pickWeighted(
    entries.map((e) => ({ ...e, weight: chances.get(e.id) ?? 0 })),
    cryptoRandom,
  );
  return entries.find((e) => e.id === drawn?.id) ?? null;
}

export interface SpinWheelHandle {
  /** Draws the winner with crypto randomness, then animates to it. */
  spin: () => void;
  /** Jumps to the end of a running spin, or past the winner's moment. */
  skip: () => void;
}

interface SpinWheelProps {
  ref?: Ref<SpinWheelHandle>;
  entries: WheelEntry[];
  /** Admin treat for this browser; the wheel draws equal slices either way. */
  pins?: TreatPins;
  onResult: (entry: WheelEntry) => void;
  /** The wheel has stopped on `entry`; `onResult` follows after its moment. */
  onReveal?: (entry: WheelEntry) => void;
  onSpinningChange?: (spinning: boolean) => void;
  /** Stays flat with no moment, for the chat card. */
  compact?: boolean;
  className?: string;
}

/** A 3D gameshow wheel when the device can run it, the flat wheel otherwise. */
export function SpinWheel({
  ref,
  entries,
  pins,
  onResult,
  onReveal,
  onSpinningChange,
  compact,
  className,
}: SpinWheelProps) {
  const slices = useMemo(() => slicesOf(entries), [entries]);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(SPIN_MS);
  const [live, setLive] = useState(false);
  const scene = useRef<WheelScene | null>(null);
  const pending = useRef<WheelEntry | null>(null);
  const landed = useRef(false);
  const wasLive = useRef(false);
  const holdTimer = useRef<number | undefined>(undefined);
  const lastTick = useRef(0);

  function finish() {
    window.clearTimeout(holdTimer.current);
    const winner = pending.current;
    if (!winner) return;
    pending.current = null;
    landed.current = false;
    onSpinningChange?.(false);
    onResult(winner);
  }

  function land() {
    const winner = pending.current;
    if (!winner || landed.current) return;
    landed.current = true;
    haptic([30, 40, 30]);
    clack(0.7);
    onReveal?.(winner);
    if (compact) finish();
    else holdTimer.current = window.setTimeout(finish, REVEAL_MS);
  }

  function tick() {
    const now = performance.now();
    if (now - lastTick.current < TICK_GAP_MS) return;
    lastTick.current = now;
    clack(0.1);
    haptic(4);
  }

  useImperativeHandle(ref, () => ({
    spin() {
      const winner = draw(entries, pins);
      if (!winner || pending.current) return;
      pending.current = winner;
      const target = rotationFor(slices, winner.id, rotation);
      setRotation(target);
      onSpinningChange?.(true);
      haptic(10);
      if (scene.current && live) scene.current.spin(target, tick, land);
      else setDuration(SPIN_MS);
    },
    skip() {
      if (!pending.current) return;
      if (landed.current) finish();
      else if (scene.current && live) scene.current.skip();
      else setDuration(0);
    },
  }));

  // A zero-length transition fires no transitionend, so skip lands here.
  useEffect(() => {
    if (live || duration !== 0 || !pending.current) return;
    const id = requestAnimationFrame(() => land());
    return () => cancelAnimationFrame(id);
  });

  // The GL context died under a spin: the result still stands.
  useEffect(() => {
    if (wasLive.current && !live) land();
    wasLive.current = live;
  });

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  function lean(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    scene.current?.lean(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      ((event.clientY - box.top) / box.height) * 2 - 1,
    );
  }

  return (
    <div
      className={cn("relative mx-auto aspect-square w-full", compact ? "max-w-md" : "max-w-160", className)}
      onPointerMove={compact ? undefined : lean}
      onPointerLeave={compact ? undefined : () => scene.current?.lean(0, 0)}
    >
      <div className={cn("size-full transition-opacity duration-500", !compact && "p-[7%]", live && "opacity-0")}>
        <FlatWheel
          slices={slices}
          repeated={slices.length > entries.length}
          label={entries.map((e) => e.label).join(", ")}
          rotation={rotation}
          durationMs={live ? null : duration}
          onSpinEnd={land}
        />
      </div>
      {!compact && (
        <WheelCanvas slices={slices} rotation={rotation} sceneRef={scene} live={live} onLiveChange={setLive} />
      )}
    </div>
  );
}
