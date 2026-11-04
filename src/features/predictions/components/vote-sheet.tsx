"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import type { Side } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import { predictionsApi } from "../api";
import { SideToggle } from "./side-toggle";
import type { PredictionCardData } from "../lib/card-data";

const names = (players: PlayerRef[]) => players.map((p) => p.name).join(" & ");

interface VoteSheetProps {
  prediction: PredictionCardData;
  roster: PlayerRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoteSheet({ prediction, roster, open, onOpenChange }: VoteSheetProps) {
  const t = useTranslations("predictions.card");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("votesTitle")} side="responsive">
      <VoteList prediction={prediction} roster={roster} />
    </Sheet>
  );
}

/** Mounted only while the sheet is open, so its picks restart from the saved votes every time. */
function VoteList({ prediction, roster }: { prediction: PredictionCardData; roster: PlayerRef[] }) {
  const t = useTranslations("predictions.card");
  const router = useRouter();
  const [picks, setPicks] = useState<Record<number, Side>>(() =>
    Object.fromEntries(prediction.votes.map((v) => [v.voter.id, v.pick])),
  );

  async function handlePick(voter: PlayerRef, pick: Side | null) {
    if (!pick) return;
    const before = picks[voter.id];
    setPicks((current) => ({ ...current, [voter.id]: pick }));
    try {
      await predictionsApi.vote(prediction.id, voter.id, pick);
      router.refresh();
    } catch {
      setPicks((current) =>
        before
          ? { ...current, [voter.id]: before }
          : Object.fromEntries(Object.entries(current).filter(([id]) => Number(id) !== voter.id)),
      );
      toast.error(t("voteFailed"));
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-8 pt-3">
      <p className="mb-4 text-sm text-ivory-muted">{t("votesHint")}</p>
      <ul className="space-y-3">
        {roster.map((voter) => (
          <li key={voter.id} className="rounded-md border border-line bg-surface-2/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <PlayerAvatar player={voter} size="sm" />
              <span className="font-bold">{voter.name}</span>
            </div>
            <SideToggle
              value={picks[voter.id] ?? null}
              onChange={(pick) => void handlePick(voter, pick)}
              labelA={names(prediction.sideA)}
              labelB={names(prediction.sideB)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
