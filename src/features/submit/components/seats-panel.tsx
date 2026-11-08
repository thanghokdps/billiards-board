import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { PlayerRef } from "@/server/matches/schema";

import { GuestChalk } from "./guest-chalk";
import { IssueNote } from "./issue-note";
import type { StepIssue } from "../lib/issues";

interface SeatsPanelProps {
  people: PlayerRef[];
  newGuests: PlayerRef[];
  filled: number;
  total: number;
  issues: StepIssue[];
  disabled: boolean;
  onAddGuest: (name: string) => void;
  onRemoveGuest: (id: number) => void;
}

/** Under the table in step 2: how many seats are filled, the chalk slate for a guest, and the guests chalked so far. */
export function SeatsPanel({
  people,
  newGuests,
  filled,
  total,
  issues,
  disabled,
  onAddGuest,
  onRemoveGuest,
}: SeatsPanelProps) {
  const t = useTranslations("submit.seats");
  return (
    <div className="space-y-3">
      <p aria-live="polite" className="text-center text-sm font-semibold">
        {t("status", { filled, total })}
      </p>
      <p className="text-center text-xs text-ivory-muted">{t("hint")}</p>
      <IssueNote step="seats" issues={issues} />
      <GuestChalk taken={people.map((p) => p.name)} disabled={disabled} onAdd={onAddGuest} />
      {newGuests.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("newGuests")}>
          {newGuests.map((guest) => (
            <li key={guest.id}>
              <Button
                variant="outline"
                className="h-11 border-dashed border-chalk/70 text-chalk"
                disabled={disabled}
                aria-label={t("removeGuest", { name: guest.name })}
                onClick={() => onRemoveGuest(guest.id)}
              >
                {guest.name}
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
