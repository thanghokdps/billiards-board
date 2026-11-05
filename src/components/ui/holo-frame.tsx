"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

const MAX_TILT_DEG = 9;

interface HoloFrameProps {
  children: ReactNode;
  /** Corner radius of the sheen, to match the child's. */
  rounded?: string;
}

/**
 * Leans its child towards the pointer and slides a foil sheen across it. Runs on CSS variables alone, so a move costs
 * no React render. `touch-pan-y` keeps vertical scrolling: a phone tilts on a sideways drag or a press.
 */
export function HoloFrame({ children, rounded = "rounded-xl" }: HoloFrameProps) {
  const ref = useRef<HTMLDivElement>(null);

  const lean = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (event.clientX - left) / width;
    const y = (event.clientY - top) / height;
    el.style.setProperty("--tilt-x", `${((0.5 - y) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x - 0.5) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty("--foil-x", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--foil-y", `${(y * 100).toFixed(1)}%`);
    el.dataset.leaning = "";
  };

  const settle = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    delete el.dataset.leaning;
  };

  return (
    <div className="h-full [perspective:60rem]">
      <div
        ref={ref}
        onPointerMove={lean}
        onPointerLeave={settle}
        onPointerCancel={settle}
        onPointerUp={(event) => {
          if (event.pointerType === "touch") settle();
        }}
        className="holo-frame relative h-full touch-pan-y"
      >
        {children}
        <div aria-hidden className={cn("holo-foil pointer-events-none absolute inset-0", rounded)} />
      </div>
    </div>
  );
}
