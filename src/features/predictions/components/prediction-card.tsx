"use client";

import { Ban, Vote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import { predictionsApi } from "../api";
import { PredictionSide } from "./prediction-side";
import { VoteSheet } from "./vote-sheet";
import type { PredictionCardData } from "../lib/card-data";

const STATUS_TONE = { open: "lamp", settled: "felt", cancelled: "neutral" } as const;

interface PredictionCardProps {
  prediction: PredictionCardData;
  /** Players who can vote; only the admin's vote sheet needs it. */
  roster?: PlayerRef[];
  admin?: boolean;
}

export function PredictionCard({ prediction, roster = [], admin = false }: PredictionCardProps) {
  const t = useTranslations("predictions.card");
  const locale = useLocale();
  const router = useRouter();
  const [voting, setVoting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isOpen = prediction.status === "open";
  const votersOn = (side: "a" | "b") => prediction.votes.filter((v) => v.pick === side).map((v) => v.voter);

  async function handleCancel() {
    setCancelling(true);
    try {
      await predictionsApi.cancel(prediction.id);
      toast.success(t("cancelled"));
      router.refresh();
    } catch {
      toast.error(t("cancelFailed"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[prediction.status]} size="md">
            {t(`status.${prediction.status}`)}
          </Badge>
          {prediction.gameType && <GameTypeBadge gameType={prediction.gameType} />}
          <time dateTime={prediction.date} className="ml-auto text-xs text-ivory-faint">
            {formatDate(prediction.date, locale)}
          </time>
        </div>

        <div aria-live="polite" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
          <PredictionSide
            players={prediction.sideA}
            voters={votersOn("a")}
            won={prediction.winnerSide === "a"}
            align="left"
          />
          <span className="pt-4 font-display text-xl font-bold text-lamp">VS</span>
          <PredictionSide
            players={prediction.sideB}
            voters={votersOn("b")}
            won={prediction.winnerSide === "b"}
            align="right"
          />
        </div>

        {admin && isOpen && (
          <div className="flex gap-2 border-t border-line pt-3">
            <Button variant="felt" size="sm" onClick={() => setVoting(true)} className="flex-1">
              <Vote className="size-4" aria-hidden />
              {t("enterVotes")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void handleCancel()} disabled={cancelling}>
              <Ban className="size-4" aria-hidden />
              {t("cancel")}
            </Button>
            <VoteSheet prediction={prediction} roster={roster} open={voting} onOpenChange={setVoting} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
