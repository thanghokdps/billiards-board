"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchRow } from "@/components/ui/match-row";
import type { Streak } from "@/components/ui/player-avatar";
import { matchesApi } from "@/features/matches";
import { useRouter } from "@/i18n/navigation";
import type { SpecialReason } from "@/lib/stats";
import type { MatchView } from "@/server/matches/schema";

interface ScoreboardProps {
  matches: MatchView[];
  streaks: Record<number, Streak | null>;
  specials: Record<string, SpecialReason | null>;
  admin: boolean;
}

const UNDO_WINDOW_MS = 8000;

export function Scoreboard({ matches, streaks, specials, admin }: ScoreboardProps) {
  const t = useTranslations("home.scoreboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleRestore(id: string) {
    try {
      await matchesApi.restore(id, "ui");
      toast.success(t("restored"));
      router.refresh();
    } catch {
      toast.error(t("restoreFailed"));
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await matchesApi.remove(id, "ui");
      router.refresh();
      toast(t("deleted"), {
        duration: UNDO_WINDOW_MS,
        action: { label: tc("undo"), onClick: () => void handleRestore(id) },
      });
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-line">
      {matches.map((m) => {
        const reason = specials[m.id];
        const footer =
          reason || admin ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {reason && (
                <>
                  <Badge tone="lamp" size="md">
                    <Sparkles className="size-3.5" aria-hidden />
                    {t(`special.${reason}`)}
                  </Badge>
                  <a
                    href={`/api/poster/match/${m.id}?locale=${locale}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-lamp underline-offset-2 hover:underline"
                  >
                    {t("poster")}
                  </a>
                </>
              )}
              {admin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={t("delete")}
                  disabled={busyId === m.id}
                  onClick={() => void handleDelete(m.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          ) : null;
        return (
          <li key={m.id}>
            <MatchRow match={m} streaks={streaks} footer={footer} />
          </li>
        );
      })}
    </ul>
  );
}
