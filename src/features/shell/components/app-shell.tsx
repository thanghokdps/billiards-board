"use client";

import { LogIn, Menu, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Ball } from "@/components/ui/ball";
import { Sheet } from "@/components/ui/sheet";
import { MatchMomentOverlay } from "@/features/matches";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

import { LanguageSwitch } from "./language-switch";
import { ChatContext, type ChatControls, type PendingChatMessage } from "../chat-context";
import { isActive, NAV_ITEMS } from "../nav-items";

// The chat (CopilotKit) is loaded for the admin only; viewers never download it.
const AdminChat = dynamic(() => import("@/features/chat").then((m) => m.AdminChat), { ssr: false });

interface AppShellProps {
  admin: boolean;
  children: ReactNode;
}

export function AppShell({ admin, children }: AppShellProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<PendingChatMessage | undefined>();
  const [moreOpen, setMoreOpen] = useState(false);

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

  const tabs = NAV_ITEMS.filter((i) => i.tab);
  const more = NAV_ITEMS.filter((i) => !i.tab);
  const fullBleed = pathname === "/tv" || pathname.startsWith("/wrapped/");

  if (fullBleed) return <ChatContext.Provider value={controls}>{children}</ChatContext.Provider>;

  return (
    <ChatContext.Provider value={controls}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lamp focus:px-3 focus:py-2 focus:text-night"
      >
        {t("skip")}
      </a>
      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/60 px-4 py-5 backdrop-blur lg:flex">
          <Brand />
          <nav aria-label={t("mainNav")} className="mt-8 flex-1 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-lamp/12 text-lamp"
                    : "text-ivory-muted hover:bg-surface-2 hover:text-ivory",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {t(item.key)}
              </Link>
            ))}
          </nav>
          {admin && (
            <button
              type="button"
              onClick={() => open()}
              className="mt-4 flex items-center gap-3 rounded-lg border border-lamp/40 bg-lamp/10 p-3 text-left transition-colors hover:bg-lamp/15"
            >
              <Ball className="size-10" />
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-wide text-lamp">
                  {t("chat")}
                </span>
                <span className="block text-xs text-ivory-muted">⌘K</span>
              </span>
            </button>
          )}
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-[var(--header-h)] items-center gap-3 border-b border-line bg-night/80 px-4 backdrop-blur-md lg:px-8">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitch />
              {admin ? (
                <Link
                  href="/admin"
                  className="flex h-8 items-center gap-1.5 rounded-full bg-felt/40 px-3 text-xs font-bold text-win"
                  aria-label={t("admin")}
                >
                  <ShieldCheck className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{t("admin")}</span>
                </Link>
              ) : (
                <Link
                  href="/admin"
                  className="flex size-8 items-center justify-center rounded-full text-ivory-muted hover:bg-surface-2 hover:text-ivory"
                  aria-label={t("login")}
                >
                  <LogIn className="size-4" aria-hidden />
                </Link>
              )}
            </div>
          </header>

          <main
            id="main"
            // Each page sets its own width and gutter (`mx-auto max-w-5xl px-4 py-6`); main only clears the tab bar.
            className="w-full pb-[calc(var(--nav-h)+1rem)] lg:pb-6"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Phone tab bar: Home · History · 8-ball · Board · More */}
      <nav
        aria-label={t("mainNav")}
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/90 backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto grid h-[var(--nav-h)] max-w-md grid-cols-5 items-center">
          {tabs.slice(0, 2).map((item) => (
            <TabLink
              key={item.href}
              item={item}
              label={t(item.key === "home" ? "homeShort" : item.key)}
              active={isActive(pathname, item.href)}
            />
          ))}
          <li className="flex justify-center">
            {admin ? (
              <button
                type="button"
                onClick={() => open()}
                aria-label={t("openChat")}
                className="-mt-7 flex size-16 items-center justify-center rounded-full bg-night shadow-lamp ring-4 ring-night animate-pulse-ring"
              >
                <Ball className="size-14" />
              </button>
            ) : (
              <Link
                href="/wheel"
                aria-label={t("openWheel")}
                className="-mt-7 flex size-16 items-center justify-center rounded-full bg-night shadow-lamp ring-4 ring-night"
              >
                <Ball className="size-14" />
              </Link>
            )}
          </li>
          <TabLink item={tabs[2]!} label={t("leaderboardShort")} active={isActive(pathname, tabs[2]!.href)} />
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2 text-2xs font-semibold",
                more.some((i) => isActive(pathname, i.href)) ? "text-lamp" : "text-ivory-muted",
              )}
            >
              <Menu className="size-5" aria-hidden />
              {t("more")}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title={t("more")}>
        <ul className="grid grid-cols-3 gap-2 p-5 pb-8">
          {more.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center text-xs font-semibold",
                  isActive(pathname, item.href)
                    ? "border-lamp/50 bg-lamp/10 text-lamp"
                    : "border-line bg-surface-2 text-ivory-muted",
                )}
              >
                <item.icon className="size-6" aria-hidden />
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>

      {admin && (
        <>
          <AdminChat open={chatOpen} onOpenChange={setChatOpen} pendingMessage={pending} onPendingSent={clearPending} />
          <MatchMomentOverlay />
        </>
      )}
    </ChatContext.Provider>
  );
}

function TabLink({ item, label, active }: { item: (typeof NAV_ITEMS)[number]; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 py-2 text-2xs font-semibold",
          active ? "text-lamp" : "text-ivory-muted",
        )}
      >
        <item.icon className="size-5" aria-hidden />
        {label}
      </Link>
    </li>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  const t = useTranslations("common");
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={t("appName")}>
      <Ball className={compact ? "size-8" : "size-10"} />
      <span className="leading-none">
        <span className="block font-display text-xl font-bold uppercase tracking-wide">{t("appName")}</span>
        {!compact && <span className="mt-1 block text-2xs text-ivory-muted">{t("slogan")}</span>}
      </span>
    </Link>
  );
}
