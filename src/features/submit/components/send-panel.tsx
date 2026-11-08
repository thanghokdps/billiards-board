import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { PlayerRef } from "@/server/matches/schema";

import { MatchStrip } from "./match-strip";
import type { Failure } from "../hooks/use-submit";
import type { Draft } from "../lib/draft";

const KNOWN_ERRORS = ["rate_limited", "too_large", "invalid_body", "conflict", "not_found", "unauthenticated"];

interface SendPanelProps {
  draft: Draft;
  sides: { sideA: PlayerRef[]; sideB: PlayerRef[] };
  failure: Failure | null;
  sending: boolean;
  blocked: boolean;
  /** The admin's Edit saves and approves; a viewer only sends. */
  edit: boolean;
  disabled: boolean;
  onSend: () => void;
}

/** Step 6: the match in one glance, the send button, and why the last send failed. */
export function SendPanel({ draft, sides, failure, sending, blocked, edit, disabled, onSend }: SendPanelProps) {
  const t = useTranslations("submit.send");
  const error = failure && (KNOWN_ERRORS.includes(failure.code) ? failure.code : "failed");
  return (
    <div className="space-y-3">
      <MatchStrip draft={draft} sides={sides} />
      {error && (
        <p role="alert" className="rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-sm text-loss">
          {t(`errors.${error}`, { minutes: failure?.waitMinutes ?? 1 })}
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || blocked || sending}
        aria-busy={sending}
        onClick={onSend}
      >
        <Send className="size-5" aria-hidden />
        {t(sending ? "sending" : edit ? "approve" : "send")}
      </Button>
      <p className="text-center text-xs text-ivory-muted">{t(edit ? "hintEdit" : "hint")}</p>
    </div>
  );
}
