"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { GuestBadge } from "@/components/ui/guest-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { clack, haptic } from "@/lib/feedback";
import type { PlayerRef } from "@/server/matches/schema";

import { isTempGuest } from "../lib/temp-guest";

function CueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M3 21 19 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 5l2-2" stroke="var(--color-chalk)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A new ball rolls in from the slate's side: leftward, so the spin runs counter-clockwise. */
const ROLL_IN = { x: 72, rotate: 360, opacity: 0 };

interface RosterTileProps {
  player: PlayerRef;
  included: boolean;
  isSpinner: boolean;
  picked: boolean;
  /** Just added: the ball rolls in with a clack and a haptic. */
  arrived: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSpinner: () => void;
  onRemove: () => void;
}

export function RosterTile({
  player,
  included,
  isSpinner,
  picked,
  arrived,
  disabled,
  onToggle,
  onSpinner,
  onRemove,
}: RosterTileProps) {
  const t = useTranslations("wheel");
  const temp = isTempGuest(player);
  const status = isSpinner ? t("spinnerBadge") : picked ? t("picked") : included ? null : t("resting");

  useEffect(() => {
    if (!arrived) return;
    clack(0.3);
    haptic();
  }, [arrived]);

  return (
    <motion.li
      layout
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={{ opacity: included ? 1 : 0.55 }}
      className={cn(
        "relative min-w-0 rounded-lg border bg-surface-2 transition-colors",
        isSpinner || arrived
          ? "border-lamp shadow-lamp"
          : included
            ? "border-line-strong"
            : "border-line border-dashed",
      )}
    >
      <div className="flex items-center">
        <button
          type="button"
          aria-pressed={included}
          disabled={disabled}
          onClick={onToggle}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-2 text-left disabled:cursor-not-allowed"
        >
          <motion.span
            initial={arrived ? ROLL_IN : false}
            animate={{ x: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="shrink-0"
          >
            <PlayerAvatar
              player={player}
              size="sm"
              className={cn(
                included ? undefined : "grayscale",
                temp && "rounded-full outline-2 outline-offset-2 outline-chalk outline-dashed",
              )}
            />
          </motion.span>
          <span className="min-w-0">
            <span className="block truncate font-bold">{player.name}</span>
            {(player.guest || status) && (
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {player.guest && <GuestBadge temp={temp} />}
                {status && (
                  <span className={cn("truncate text-2xs", isSpinner ? "text-lamp" : "text-ivory-muted")}>
                    {status}
                  </span>
                )}
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
      </div>
      {temp && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={t("tempRemoveLabel", { name: player.name })}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-b-lg border-t border-dashed border-chalk/50 text-xs font-semibold text-chalk transition-colors hover:bg-surface-3 disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
          {t("tempRemove")}
        </button>
      )}
    </motion.li>
  );
}
