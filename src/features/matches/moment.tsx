"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { celebrate, clack, haptic } from "@/lib/feedback";
import type { MatchEvent } from "@/server/events/types";

type Moment = MatchEvent | null;

let current: Moment = null;
const listeners = new Set<() => void>();
const emit = (next: Moment) => {
  current = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** After a save: every save clacks; a special match (streak broken, comeback …) also plays its moment. */
export function useMatchMoment() {
  return useCallback((events: MatchEvent[]) => {
    clack();
    haptic(events.length ? [40, 60, 40, 60, 80] : 18);
    const first = events[0];
    if (!first) return;
    void celebrate();
    document.documentElement.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 320, iterations: 2 },
    );
    emit(first);
  }, []);
}

export function MatchMomentOverlay() {
  const moment = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const t = useTranslations("chat.card");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          key={moment.matchId}
          role="dialog"
          aria-modal="true"
          aria-label={t(`special.${moment.type}`)}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-night/80 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => emit(null)}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-xl border border-lamp/40 bg-surface shadow-pop"
            initial={{ y: 120, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={`/api/poster/match/${moment.matchId}?locale=${locale}`}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="font-display text-2xl font-bold uppercase tracking-wide text-lamp">
                {moment.type === "streak_broken" ? t("streakBroken") : t(`special.${moment.type}`)}
              </p>
              <Button variant="ghost" size="icon-sm" onClick={() => emit(null)} aria-label={tc("close")}>
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
