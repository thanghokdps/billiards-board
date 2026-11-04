"use client";

import "@copilotkit/react-core/v2/styles.css";

import { CopilotKitProvider, useCopilotKit } from "@copilotkit/react-core/v2";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Sheet } from "@/components/ui/sheet";
import type { PendingChatMessage } from "@/features/shell";

import { ChatPanel } from "./chat-panel";

interface AdminChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingMessage: PendingChatMessage | undefined;
  onPendingSent: () => void;
}

const localeHeaders = (locale: string) => ({ "x-anbill-locale": locale });

/** The runtime reads the reply language from this header; the admin cookie carries identity. */
function HeaderSync({ locale }: { locale: string }) {
  const { copilotkit } = useCopilotKit();
  useEffect(() => copilotkit.setHeaders(localeHeaders(locale)), [copilotkit, locale]);
  return null;
}

export function AdminChat({ open, onOpenChange, pendingMessage, onPendingSent }: AdminChatProps) {
  const t = useTranslations("chat");
  const locale = useLocale();
  // Frozen at mount: the provider writes `headers` once; later changes go through HeaderSync.
  const [headers] = useState(() => localeHeaders(locale));

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={headers}
      credentials="same-origin"
      enableInspector={false}
    >
      <HeaderSync locale={locale} />
      <Sheet open={open} onOpenChange={onOpenChange} title={t("title")} side="responsive" className="anbill-chat">
        <ChatPanel pendingMessage={pendingMessage} onPendingSent={onPendingSent} />
      </Sheet>
    </CopilotKitProvider>
  );
}
