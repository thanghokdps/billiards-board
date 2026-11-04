"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

export const SLIDE_MS = 6000;

type BarState = "done" | "active" | "todo";

interface StoryBarsProps {
  count: number;
  index: number;
  paused: boolean;
  /** Reduced motion: bars are static and the story never advances on its own. */
  reduced: boolean;
  onFinish: () => void;
}

/** Progress bars of a story. The active bar is a Web Animation, so holding the screen just pauses it. */
export function StoryBars({ count, index, paused, reduced, onFinish }: StoryBarsProps) {
  return (
    <ol aria-hidden className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <StoryBar
          key={i}
          state={i < index ? "done" : i === index ? "active" : "todo"}
          paused={paused}
          reduced={reduced}
          onFinish={onFinish}
        />
      ))}
    </ol>
  );
}

function StoryBar({
  state,
  paused,
  reduced,
  onFinish,
}: {
  state: BarState;
  paused: boolean;
  reduced: boolean;
  onFinish: () => void;
}) {
  const fill = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const finish = useRef(onFinish);

  useEffect(() => {
    finish.current = onFinish;
  });

  useEffect(() => {
    const element = fill.current;
    if (state !== "active" || reduced || !element) return;
    const running = element.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: SLIDE_MS,
      easing: "linear",
      fill: "forwards",
    });
    running.onfinish = () => finish.current();
    animation.current = running;
    return () => {
      running.cancel();
      animation.current = null;
    };
  }, [state, reduced]);

  useEffect(() => {
    const running = animation.current;
    if (!running) return;
    // play() on a finished animation would restart it, so only resume a paused one.
    if (paused && running.playState === "running") running.pause();
    else if (!paused && running.playState === "paused") running.play();
  }, [paused, state, reduced]);

  const filled = state === "done" || (state === "active" && reduced);
  return (
    <li className="h-1 flex-1 overflow-hidden rounded-full bg-ivory-faint">
      <div
        ref={fill}
        className={cn("h-full origin-left rounded-full bg-ivory")}
        style={{ transform: filled ? "scaleX(1)" : "scaleX(0)" }}
      />
    </li>
  );
}
