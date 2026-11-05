"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import type { PlayerRef } from "@/server/matches/schema";

/** The name card over the wheel while the winning wedge stands out. */
export function WinnerReveal({ player }: { player: PlayerRef | null }) {
  const t = useTranslations("wheel");
  return (
    <AnimatePresence>
      {player && (
        <motion.div
          key={player.id}
          initial={{ scale: 0.4, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
          className="pointer-events-none absolute inset-x-4 bottom-4 z-20 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-lamp/50 bg-night/85 py-2 pl-2 pr-6 shadow-pop backdrop-blur-sm"
        >
          <PlayerAvatar player={player} size="md" />
          <span className="min-w-0">
            <span className="block text-2xs font-semibold uppercase tracking-widest text-lamp">{t("revealWin")}</span>
            <span className="block truncate font-display text-3xl font-bold leading-none">{player.name}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
