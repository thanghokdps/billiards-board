"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { matchesApi } from "@/features/matches";
import { useChat } from "@/features/shell";
import { haptic } from "@/lib/feedback";

import { useAdminRun } from "../hooks/use-admin-run";

interface MatchAdminActionsProps {
  matchId: string;
  shortId: string;
  /** Closes the sheet once the match is gone or the chat has taken over. */
  onDone: () => void;
}

/** Edit via chat, or delete behind a confirm. Delete is a soft delete, so the toast offers an undo. */
export function MatchAdminActions({ matchId, shortId, onDone }: MatchAdminActionsProps) {
  const t = useTranslations("history.admin");
  const tc = useTranslations("common");
  const chat = useChat();
  const { pending, run } = useAdminRun();
  const [confirming, setConfirming] = useState(false);

  function handleEditViaChat() {
    chat.open(t("chatPrefill", { id: shortId }), "prefill");
    onDone();
  }

  async function handleUndo() {
    const ok = await run(async () => {
      await matchesApi.restore(matchId, "ui");
    });
    if (ok) toast.success(t("matchRestored"));
  }

  async function handleDelete() {
    const ok = await run(async () => {
      await matchesApi.remove(matchId, "ui");
    });
    if (!ok) return;
    haptic();
    onDone();
    toast(t("matchDeleted"), { duration: 8000, action: { label: tc("undo"), onClick: () => void handleUndo() } });
  }

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-label={t("confirmTitle")}
        className="space-y-3 rounded-md border border-loss/40 bg-loss/10 p-4"
      >
        <p className="font-display text-xl font-bold leading-tight">{t("confirmTitle")}</p>
        <p className="text-sm text-ivory-muted">{t("confirmBody")}</p>
        <div className="flex gap-2">
          <Button variant="danger" disabled={pending} onClick={() => void handleDelete()}>
            <Trash2 className="size-4" aria-hidden />
            {pending ? t("deleting") : t("confirmYes")}
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            {tc("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chat.available && (
        <Button variant="outline" onClick={handleEditViaChat}>
          <MessageSquarePlus className="size-4" aria-hidden />
          {t("editViaChat")}
        </Button>
      )}
      <Button variant="outline" className="text-loss" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden />
        {t("deleteMatch")}
      </Button>
    </div>
  );
}
