"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

import { MemberApiError, memberErrorKey, memberMatchesApi } from "../member-api";

interface CancelMatchProps {
  id: string;
  /** The server dropped the match; the caller refreshes or leaves the page. */
  onCancelled: () => void;
  size?: "sm" | "md";
  className?: string;
}

/** "Huỷ trận" with a confirm sheet: an unplayed match can go, one with a result waits for the admin. */
export function CancelMatch({ id, onCancelled, size = "md", className }: CancelMatchProps) {
  const t = useTranslations("submit");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await memberMatchesApi.cancel(id);
      setOpen(false);
      onCancelled();
    } catch (failure) {
      setError(memberErrorKey(failure instanceof MemberApiError ? failure.code : "failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size={size} className={className} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden />
        {t("cancel.open")}
      </Button>
      <Sheet open={open} onOpenChange={(next) => !busy && setOpen(next)} title={t("cancel.title")}>
        <div className="space-y-4 px-5 pt-2 pb-6">
          <p className="text-sm text-ivory-muted">{t("cancel.body")}</p>
          {error && (
            <p role="alert" className="rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-sm text-loss">
              {t(`errors.${error}`)}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" disabled={busy} onClick={() => setOpen(false)}>
              {t("cancel.keep")}
            </Button>
            <Button variant="danger" size="lg" disabled={busy} aria-busy={busy} onClick={confirm}>
              {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {t("cancel.confirm")}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
