"use client";

import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";

import { Ball } from "@/components/ui/ball";
import { clack, haptic } from "@/lib/feedback";
import { prefersReducedMotion } from "@/lib/motion";
import type { HeadToHead } from "@/lib/stats";

/** When the balls touch: `clash-a` reaches contact at 73% of its 0.85 s. */
const IMPACT_MS = 620;

/** The head-to-head split as a collision: each ball rolls in and they meet at the split. A tap replays it with sound. */
export function BallClash({ h }: { h: HeadToHead }) {
  const t = useTranslations("rivalry");
  const [take, setTake] = useState(0);

  const replay = () => {
    setTake((n) => n + 1);
    if (prefersReducedMotion()) return;
    window.setTimeout(() => {
      clack();
      haptic();
    }, IMPACT_MS);
  };

  return (
    <button type="button" onClick={replay} aria-label={t("clashReplay")} className="press mt-5 block w-full">
      {/* The key restarts every CSS animation inside. */}
      <span
        key={take}
        aria-hidden
        className="clash"
        style={{ ["--split" as string]: `${(h.aWins / h.played) * 100}%` } as CSSProperties}
      >
        <span className="clash-track">
          <span style={{ backgroundColor: h.a.ballColor }} />
          <span style={{ backgroundColor: h.b.ballColor }} />
        </span>
        <span className="clash-ring" />
        <span className="clash-ball clash-ball-a">
          <Ball color={h.a.ballColor} number={h.a.ballNumber} className="size-full" />
        </span>
        <span className="clash-ball clash-ball-b">
          <Ball color={h.b.ballColor} number={h.b.ballNumber} className="size-full" />
        </span>
      </span>
    </button>
  );
}
