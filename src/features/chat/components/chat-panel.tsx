"use client";

import {
  CopilotChat,
  useAgent,
  useAgentContext,
  useConfigureSuggestions,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import { Mic, MicOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PendingChatMessage } from "@/features/shell";
import { AGENT_ID, CHAT_PAGE_CONTEXT, OPEN_CARDS_CONTEXT } from "@/lib/agent-results";
import { cn } from "@/lib/cn";
import { localDate } from "@/lib/domain";

import { ChatView } from "./chat-view";
import { CHAT_PAGE_ID, getOpenCardIds, subscribeCards } from "../lib/card-store";
import { DraftContext, type Draft } from "../lib/draft-context";
import { SendContext } from "../lib/send-context";
import { useSpeech } from "../lib/use-speech";
import { useToolRenderers } from "../renderers/tool-result";

const SUGGESTION_KEYS = ["log", "batch", "money", "h2h", "wheel", "roast"] as const;

interface ChatPanelProps {
  pendingMessage: PendingChatMessage | undefined;
  onPendingSent: () => void;
}

/** The admin chat: stock CopilotChat on today's thread, tool cards, suggestions, mic and prefill. */
export function ChatPanel({ pendingMessage, onPendingSent }: ChatPanelProps) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: AGENT_ID });
  // One thread per day (ADR): the server prunes threads older than 30 days.
  const [threadId] = useState(() => `admin-${localDate(new Date())}`);
  const [spoken, setSpoken] = useState<Draft | null>(null);

  useToolRenderers();

  // Tapping a card never reaches the agent, so each run tells it which cards are still open.
  const openCards = useSyncExternalStore(subscribeCards, getOpenCardIds, getOpenCardIds);
  useAgentContext({ description: OPEN_CARDS_CONTEXT, value: openCards });
  useAgentContext({ description: CHAT_PAGE_CONTEXT, value: CHAT_PAGE_ID });

  const suggestions = useMemo(
    () => SUGGESTION_KEYS.map((key) => ({ title: t(`suggestions.${key}`), message: t(`suggestions.${key}`) })),
    [t],
  );
  // Called outside CopilotChat's config provider, so the agent id is passed or it falls back to "default".
  useConfigureSuggestions({ suggestions, available: "before-first-message", consumerAgentId: AGENT_ID }, [suggestions]);

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || agent.isRunning) return;
      agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
      void copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );

  // A prefill request lands in the composer through ChatView before the effect below clears it.
  const draft: Draft | null =
    pendingMessage?.mode === "prefill" ? { text: pendingMessage.text, nonce: pendingMessage.id } : spoken;

  useEffect(() => {
    if (!pendingMessage) return;
    if (pendingMessage.mode === "send") send(pendingMessage.text);
    onPendingSent();
  }, [pendingMessage, send, onPendingSent]);

  const onTranscript = useCallback((text: string) => setSpoken({ text, nonce: Date.now() }), []);
  const speech = useSpeech(locale, onTranscript);

  return (
    <SendContext.Provider value={send}>
      <DraftContext.Provider value={draft}>
        <div className="chat-theme dark flex h-full min-h-0 flex-col">
          <CopilotChat
            agentId={AGENT_ID}
            threadId={threadId}
            className="min-h-0 flex-1"
            onError={(event) => {
              // The prop type also admits the div's DOM onError; only CopilotKit run errors carry `code`.
              if (!("code" in event)) return;
              // The runtime answers 401 once the 30-day admin cookie expires.
              toast.error(/\b401\b|unauthori/i.test(event.error.message) ? t("unauthorized") : t("error"));
            }}
            chatView={ChatView}
            labels={{ chatInputPlaceholder: t("placeholder"), chatDisclaimerText: t("disclaimer") }}
            welcomeScreen={{
              welcomeMessage: () => (
                <div className="px-2 pb-4 text-center">
                  <p className="font-display text-2xl font-bold uppercase tracking-wide text-ivory">
                    {t("welcomeTitle")}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-ivory-muted">{t("welcomeBody")}</p>
                </div>
              ),
            }}
          />
          <MicBar speech={speech} />
        </div>
      </DraftContext.Provider>
    </SendContext.Provider>
  );
}

function MicBar({ speech }: { speech: ReturnType<typeof useSpeech> }) {
  const t = useTranslations("chat");
  if (!speech.supported) return null;
  return (
    <div className="flex items-center gap-3 border-t border-line px-4 py-2" aria-live="polite">
      <Button
        variant={speech.listening ? "danger" : "felt"}
        size="icon"
        className={cn("rounded-full", speech.listening && "animate-pulse-ring")}
        onClick={speech.listening ? speech.stop : speech.start}
        aria-label={speech.listening ? t("micStop") : t("mic")}
      >
        {speech.listening ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
      </Button>
      <p className="min-w-0 flex-1 truncate text-sm text-ivory-muted">
        {speech.listening ? speech.interim || t("listening") : t("mic")}
      </p>
    </div>
  );
}
