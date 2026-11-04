"use client";

import { Crosshair } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

import { useLongPress } from "../hooks/use-long-press";

interface ParticipantChipProps {
  player: PlayerRef;
  included: boolean;
  victim: boolean;
  disabled: boolean;
  /** Names the keyboard alternative (the "make victim" button in the list) for assistive tech. */
  describedBy: string;
  onToggle: () => void;
  onMakeVictim: () => void;
}

/** Tap = in / out. Long press = victim (the list below offers the same as a button for keyboards). */
export function ParticipantChip({
  player,
  included,
  victim,
  disabled,
  describedBy,
  onToggle,
  onMakeVictim,
}: ParticipantChipProps) {
  const press = useLongPress(onMakeVictim);

  return (
    <Chip
      selected={included}
      disabled={disabled}
      aria-describedby={describedBy}
      className={cn(
        "h-11 select-none gap-2 pl-1.5",
        !included && "opacity-60",
        victim && "border-loss/70 bg-loss/10 text-loss",
      )}
      onClick={() => {
        if (press.wasLongPress()) return;
        onToggle();
      }}
      {...press.handlers}
    >
      <PlayerAvatar player={player} size="sm" />
      {player.name}
      {victim && <Crosshair className="size-4" aria-hidden />}
    </Chip>
  );
}
