"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Ball } from "@/components/ui/ball";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

import { RackMenu } from "./rack-menu";
import { isActive, NAV_ITEMS, WHEEL_ITEM, type NavItem } from "../nav-items";

const SHORT_LABEL: Record<string, string> = { home: "homeShort", leaderboard: "leaderboardShort" };

/** The active tab gets a filled pill, so it does not rely on colour alone. */
function tabClass(active: boolean) {
  return cn(
    "mx-auto flex h-14 w-full max-w-20 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full text-2xs font-semibold transition-colors",
    active ? "bg-lamp/15 text-lamp" : "text-ivory-muted hover:text-ivory",
  );
}

function DockLink({ item }: { item: NavItem }) {
  const t = useTranslations("nav");
  const active = isActive(usePathname(), item.href);
  return (
    <li>
      <Link href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
        <item.icon className="size-5" aria-hidden />
        {t(SHORT_LABEL[item.key] ?? item.key)}
      </Link>
    </li>
  );
}

/** One navigation for every screen size: shortcuts either side of the 8-ball, which opens the rack of all pages. */
export function FloatingDock({ admin, onOpenChat }: { admin: boolean; onOpenChat: () => void }) {
  const t = useTranslations("nav");
  const [rackOpen, setRackOpen] = useState(false);
  const [home, history, leaderboard] = NAV_ITEMS.filter((i) => i.tab);
  return (
    <>
      <nav
        aria-label={t("mainNav")}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full border border-line-strong bg-surface/85 p-1 shadow-pop backdrop-blur-lg"
      >
        <ul className="grid grid-cols-5 items-center">
          {home && <DockLink item={home} />}
          {history && <DockLink item={history} />}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => setRackOpen(true)}
              aria-label={t("openRack")}
              aria-haspopup="dialog"
              className="-mt-6 flex size-16 cursor-pointer items-center justify-center rounded-full bg-night shadow-lamp transition-transform hover:-translate-y-0.5 hover:rotate-12 active:scale-95"
            >
              <Ball className="size-14" />
            </button>
          </li>
          {leaderboard && <DockLink item={leaderboard} />}
          {admin ? (
            <li>
              <button type="button" onClick={onOpenChat} aria-label={t("openChat")} className={tabClass(false)}>
                <MessageCircle className="size-5" aria-hidden />
                {t("chatShort")}
              </button>
            </li>
          ) : (
            <DockLink item={WHEEL_ITEM} />
          )}
        </ul>
      </nav>
      <RackMenu open={rackOpen} onOpenChange={setRackOpen} />
    </>
  );
}
