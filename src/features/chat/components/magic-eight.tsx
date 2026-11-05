"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Ball } from "@/components/ui/ball";
import { clack, haptic } from "@/lib/feedback";
import { prefersReducedMotion } from "@/lib/motion";

const SHAKE = [0, -14, 12, -10, 8, -4, 0].map((deg, i) => ({
  transform: `translateX(${deg / 2}px) rotate(${deg * (i + 1)}deg)`,
}));

/** Shaken, the 8-ball offers an idea: it fills the composer and sends nothing. */
export function MagicEight({ ideas, onPick }: { ideas: string[]; onPick: (idea: string) => void }) {
  const t = useTranslations("chat");
  const ball = useRef<HTMLSpanElement>(null);

  const shake = async () => {
    clack(0.3);
    haptic([20, 40, 20]);
    const idea = ideas[Math.floor(Math.random() * ideas.length)];
    if (!prefersReducedMotion()) await ball.current?.animate(SHAKE, { duration: 520 }).finished;
    // The welcome slot remounts when the parent re-renders, so the idea lands only after the shake ends.
    if (idea) onPick(idea);
  };

  return (
    <button
      type="button"
      onClick={() => void shake()}
      className="press mx-auto mb-3 flex flex-col items-center gap-1.5 rounded-md p-1 text-2xs font-semibold text-lamp"
    >
      <span ref={ball} className="block">
        <Ball className="eight-idle block size-16" />
      </span>
      {t("shake")}
    </button>
  );
}
