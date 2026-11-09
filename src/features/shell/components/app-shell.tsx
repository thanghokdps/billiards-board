"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Ball } from "@/components/ui/ball";
import { GoogleSignIn, LoginNotice, MemberMenu } from "@/features/auth";
import { MatchMomentOverlay } from "@/features/matches";
import { Link, usePathname } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";

import { FloatingDock } from "./floating-dock";
import { LampSmoke } from "./lamp-smoke";
import { LanguageSwitch } from "./language-switch";
import { PixelPet } from "./pixel-pet";
import { ChatContext, type ChatControls, type PendingChatMessage } from "../chat-context";

// The chat (CopilotKit) is loaded for the admin only; viewers never download it.
const AdminChat = dynamic(() => import("@/features/chat").then((m) => m.AdminChat), { ssr: false });

interface AppShellProps {
  admin: boolean;
  /** The signed-in member, if any. */
  member: PlayerRef | null;
  /** Google sign-in is set up; without it no sign-in button shows. */
  googleEnabled: boolean;
  /** Painting behind the page, from the server; left out on full-bleed screens. */
  art: ReactNode;
  children: ReactNode;
}

export function AppShell({ admin, member, googleEnabled, art, children }: AppShellProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<PendingChatMessage | undefined>();

  const open = useCallback((message?: string, mode: "send" | "prefill" = "send") => {
    setPending(message ? { id: Date.now(), text: message, mode } : undefined);
    setChatOpen(true);
  }, []);
  const clearPending = useCallback(() => setPending(undefined), []);
  const controls = useMemo<ChatControls>(
    () => ({ available: admin, isOpen: chatOpen, open, close: () => setChatOpen(false) }),
    [admin, chatOpen, open],
  );

  useEffect(() => {
    if (!admin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [admin]);

  const fullBleed = pathname === "/tv" || pathname.startsWith("/wrapped/");

  if (fullBleed) return <ChatContext.Provider value={controls}>{children}</ChatContext.Provider>;

  return (
    <ChatContext.Provider value={controls}>
      <div aria-hidden className="backdrop">
        <LampSmoke />
        {art}
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lamp focus:px-3 focus:py-2 focus:text-night"
      >
        {t("skip")}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-night/80 backdrop-blur-md">
        <div className="mx-auto flex h-(--header-h) max-w-5xl items-center gap-3 px-4">
          <Brand />
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            {member ? (
              <MemberMenu player={member} />
            ) : (
              googleEnabled && <GoogleSignIn compact variant="subtle" size="md" />
            )}
            {admin ? (
              <Link
                href="/admin"
                className="flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-win hover:bg-surface-2"
                aria-label={t("admin")}
              >
                <ShieldCheck className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t("admin")}</span>
              </Link>
            ) : (
              <Link
                href="/admin"
                className="flex size-11 items-center justify-center rounded-full text-ivory-muted hover:bg-surface-2 hover:text-ivory"
                aria-label={t("login")}
              >
                <LogIn className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
        <span aria-hidden className="scroll-cue" />
      </header>

      <main
        id="main"
        // Each page sets its own width and gutter (`mx-auto max-w-5xl px-4 py-6`); main only clears the dock.
        className="w-full pb-[calc(var(--nav-h)+2rem)]"
      >
        {children}
      </main>

      <Suspense>
        <LoginNotice />
      </Suspense>
      <FloatingDock admin={admin} onOpenChat={open} />
      <PixelPet />

      {admin && (
        <>
          <AdminChat open={chatOpen} onOpenChange={setChatOpen} pendingMessage={pending} onPendingSent={clearPending} />
          <MatchMomentOverlay />
        </>
      )}
    </ChatContext.Provider>
  );
}

function Brand() {
  const t = useTranslations("common");
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={t("appName")}>
      <Ball className="size-8" />
      <span className="leading-none">
        <span className="block font-display text-2xl font-extrabold">{t("appName")}</span>
        <span className="mt-1 hidden text-2xs text-ivory-muted sm:block">{t("slogan")}</span>
      </span>
    </Link>
  );
}
