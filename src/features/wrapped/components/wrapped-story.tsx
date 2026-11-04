"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { celebrate } from "@/lib/feedback";
import type { WrappedStory as WrappedStoryData } from "@/server/stats/wrapped";

import { SLIDES, SlideView } from "./slide-deck";
import { StoryBars } from "./story-bars";
import { useReducedMotion } from "../hooks/use-reduced-motion";

const HOLD_MS = 220;
const LAST = SLIDES.length - 1;

const TONE = {
  felt: "bg-linear-to-b from-felt-deep via-night to-night",
  lamp: "bg-linear-to-b from-lamp/20 via-night to-night",
  cold: "bg-linear-to-b from-cold/20 via-night to-night",
  loss: "bg-linear-to-b from-loss/20 via-night to-night",
} as const;

/** Full-bleed, Instagram-style story: tap left/right or use the arrow keys, hold to pause, auto-advances. */
export function WrappedStory({ story }: { story: WrappedStoryData }) {
  const t = useTranslations("wrapped.story");
  const router = useRouter();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const pressStart = useRef(0);
  const wasLongPress = useRef(false);
  const closeHref = `/wrapped?year=${story.year}`;
  const slide = SLIDES[index]!;

  const go = useCallback((delta: number) => setIndex((i) => Math.min(LAST, Math.max(0, i + delta))), []);
  const advance = useCallback(() => go(1), [go]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "Escape") router.push(closeHref);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [go, router, closeHref]);

  useEffect(() => {
    if (index === LAST) void celebrate([story.player.ballColor]);
  }, [index, story.player.ballColor]);

  const press = {
    onPointerDown: () => {
      pressStart.current = Date.now();
      wasLongPress.current = false;
      setHeld(true);
    },
    onPointerUp: () => {
      wasLongPress.current = Date.now() - pressStart.current > HOLD_MS;
      setHeld(false);
    },
    onPointerCancel: () => {
      wasLongPress.current = false;
      setHeld(false);
    },
    onPointerLeave: () => {
      wasLongPress.current = false;
      setHeld(false);
    },
    onContextMenu: (event: MouseEvent) => event.preventDefault(),
  };
  // A long press only pauses; the click that follows its release must not turn the page.
  const handleTap = (delta: number) => () => {
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    go(delta);
  };

  return (
    <main id="main" className="fixed inset-0 z-50 flex justify-center bg-night">
      <div className="relative flex h-full w-full max-w-md select-none touch-manipulation flex-col overflow-hidden">
        <div aria-hidden className={cn("absolute inset-0", TONE[slide.tone])} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 90% 45% at 50% 0%, color-mix(in srgb, ${story.player.ballColor} 35%, transparent), transparent 70%)`,
          }}
        />

        <header className="relative z-30 space-y-3 px-4 pt-4">
          <StoryBars count={SLIDES.length} index={index} paused={held} reduced={reduced} onFinish={advance} />
          <div className="flex items-center gap-2">
            <PlayerAvatar player={story.player} size="sm" />
            <span className="truncate text-sm font-bold">{story.player.name}</span>
            <span className="text-xs text-ivory-muted">{story.year}</span>
            <Button asChild variant="ghost" size="icon-sm" className="ml-auto">
              <Link href={closeHref} aria-label={t("close")}>
                <X className="size-5" aria-hidden />
              </Link>
            </Button>
          </div>
        </header>

        {/* Tap zones sit under the slide; the slide lets pointer events through except on its own buttons. */}
        <Button
          variant="ghost"
          aria-label={t("prev")}
          disabled={index === 0}
          onClick={handleTap(-1)}
          className="absolute inset-y-0 left-0 z-10 h-auto w-1/3 rounded-none hover:bg-transparent disabled:opacity-0"
          {...press}
        />
        <Button
          variant="ghost"
          aria-label={t("next")}
          disabled={index === LAST}
          onClick={handleTap(1)}
          className="absolute inset-y-0 right-0 z-10 h-auto w-2/3 rounded-none hover:bg-transparent disabled:opacity-0"
          {...press}
        />

        <div aria-live="polite" className="pointer-events-none relative z-20 flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">{t("heading", { name: story.player.name, year: story.year })}</h1>
          <p className="sr-only">{t("position", { current: index + 1, total: SLIDES.length })}</p>
          <SlideView key={slide.id} id={slide.id} story={story} onReplay={() => setIndex(0)} />
        </div>
      </div>
    </main>
  );
}
