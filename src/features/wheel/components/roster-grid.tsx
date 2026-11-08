"use client";

import { useTranslations } from "next-intl";

import type { PlayerRef } from "@/server/matches/schema";

import { GuestSlate } from "./guest-slate";
import { RosterTile } from "./roster-tile";

interface RosterGridProps {
  players: PlayerRef[];
  included: number[];
  spinnerId: number | null;
  picks: number[];
  /** The guest that has just been added, if any. */
  arrivedId: number | null;
  admin: boolean;
  disabled: boolean;
  onToggle: (id: number) => void;
  onSpinner: (id: number | null) => void;
  onAddTemp: (name: string) => void;
  onSaved: (id: number) => void;
  onRemoveTemp: (id: number) => void;
}

/** One tile per player does both old lists' jobs: tap to rest them, the cue to hand them the spin. The slate adds a guest. */
export function RosterGrid({
  players,
  included,
  spinnerId,
  picks,
  arrivedId,
  admin,
  disabled,
  onToggle,
  onSpinner,
  onAddTemp,
  onSaved,
  onRemoveTemp,
}: RosterGridProps) {
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
            arrived={arrivedId === player.id}
            disabled={disabled}
            onToggle={() => onToggle(player.id)}
            onSpinner={() => onSpinner(spinnerId === player.id ? null : player.id)}
            onRemove={() => onRemoveTemp(player.id)}
          />
        ))}
        <GuestSlate admin={admin} taken={players} disabled={disabled} onAddTemp={onAddTemp} onSaved={onSaved} />
      </ul>
      <p className="text-sm text-ivory-muted">{t("participantsHint")}</p>
    </section>
  );
}
