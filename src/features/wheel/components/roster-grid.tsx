"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

function CueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M3 21 19 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 5l2-2" stroke="var(--color-chalk)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface RosterTileProps {
  player: PlayerRef;
  included: boolean;
  isSpinner: boolean;
  picked: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSpinner: () => void;
}

function RosterTile({ player, included, isSpinner, picked, disabled, onToggle, onSpinner }: RosterTileProps) {
  const t = useTranslations("wheel");
  const status = isSpinner ? t("spinnerBadge") : picked ? t("picked") : included ? null : t("resting");
  return (
    <motion.li
      layout
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={{ opacity: included ? 1 : 0.55 }}
      className={cn(
        "relative flex min-w-0 items-center rounded-lg border bg-surface-2 transition-colors",
        isSpinner ? "border-lamp shadow-lamp" : included ? "border-line-strong" : "border-line border-dashed",
      )}
    >
      <button
        type="button"
        aria-pressed={included}
        disabled={disabled}
        onClick={onToggle}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-2 text-left disabled:cursor-not-allowed"
      >
        <PlayerAvatar player={player} size="sm" className={included ? undefined : "grayscale"} />
        <span className="min-w-0">
          <span className="block truncate font-bold">{player.name}</span>
          {status && (
            <span className={cn("block truncate text-2xs", isSpinner ? "text-lamp" : "text-ivory-muted")}>
              {status}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={isSpinner}
        aria-label={t(isSpinner ? "cueTake" : "cueGive", { name: player.name })}
        disabled={disabled || !included}
        onClick={onSpinner}
        className={cn(
          "mr-1 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30",
          isSpinner ? "bg-lamp text-night" : "text-ivory-muted hover:bg-surface-3 hover:text-ivory",
        )}
      >
        <CueIcon className="size-5" />
      </button>
    </motion.li>
  );
}

interface RosterGridProps {
  players: PlayerRef[];
  included: number[];
  spinnerId: number | null;
  picks: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
  onSpinner: (id: number | null) => void;
}

/** One tile per player does both old lists' jobs: tap to rest them, the cue to hand them the spin. */
export function RosterGrid({ players, included, spinnerId, picks, disabled, onToggle, onSpinner }: RosterGridProps) {
  const t = useTranslations("wheel");
  return (
    <section aria-label={t("participantsTitle")} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{t("participantsTitle")}</h2>
        <span className="digits text-base font-semibold text-ivory-muted">
          {t("participantsCount", { selected: included.length, total: players.length })}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
        {players.map((player) => (
          <RosterTile
            key={player.id}
            player={player}
            included={included.includes(player.id)}
            isSpinner={spinnerId === player.id}
            picked={picks.includes(player.id)}
            disabled={disabled}
            onToggle={() => onToggle(player.id)}
            onSpinner={() => onSpinner(spinnerId === player.id ? null : player.id)}
          />
        ))}
      </ul>
      <p className="text-sm text-ivory-muted">{t("participantsHint")}</p>
    </section>
  );
}
