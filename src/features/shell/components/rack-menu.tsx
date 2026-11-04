"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";

import { Ball } from "@/components/ui/ball";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

import { isActive, NAV_ITEMS, type NavItem } from "../nav-items";

const RACKED = NAV_ITEMS.filter((i) => i.ball);
const LOOSE = NAV_ITEMS.filter((i) => !i.ball);
/** Rows of a 10-ball rack, apex first: start index of row n is the triangular number n(n+1)/2. */
const RACK_ROWS = [0, 1, 2, 3].map((row) => RACKED.slice((row * (row + 1)) / 2, ((row + 1) * (row + 2)) / 2));

function RackBall({
  item,
  order,
  active,
  onPick,
}: {
  item: NavItem;
  order: number;
  active: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("nav");
  return (
    <li className="w-1/4">
      <Link
        href={item.href}
        onClick={onPick}
        aria-current={active ? "page" : undefined}
        style={{ animationDelay: `${order * 25}ms` }}
        className="group flex animate-rack-in flex-col items-center gap-1 rounded-md py-1 text-center text-xs font-semibold leading-tight"
      >
        <span
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full transition-transform duration-150 group-hover:-translate-y-1 group-hover:scale-110 group-active:scale-95 sm:size-16",
            active && "shadow-lamp ring-2 ring-lamp ring-offset-2 ring-offset-felt",
          )}
        >
          <Ball color={item.ball} number="" className="size-full drop-shadow-lg" />
          <item.icon className="absolute size-3.5 text-night sm:size-4" aria-hidden />
        </span>
        <span className={cn("rounded-full px-1.5 py-0.5", active && "bg-night/70 text-lamp")}>{t(item.key)}</span>
      </Link>
    </li>
  );
}

/** Every page as a racked ball on the felt; the 8-ball in the dock breaks it open. */
export function RackMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const close = () => onOpenChange(false);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-fade fixed inset-0 z-50 bg-night/75 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="table-rail fixed inset-x-4 bottom-[calc(var(--nav-h)+1.25rem)] z-50 mx-auto max-w-lg shadow-pop outline-none"
        >
          <Dialog.Title className="sr-only">{t("mainNav")}</Dialog.Title>
          <nav aria-label={t("mainNav")} className="felt relative rounded-md px-1 pt-4 pb-2">
            <Dialog.Close
              aria-label={t("closeMenu")}
              className="absolute top-1 right-1 flex size-11 cursor-pointer items-center justify-center rounded-full hover:bg-night/40"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
            {RACK_ROWS.map((row, r) => (
              <ul key={row[0]?.href} className="flex justify-center">
                {row.map((item, c) => (
                  <RackBall
                    key={item.href}
                    item={item}
                    order={(r * (r + 1)) / 2 + c}
                    active={isActive(pathname, item.href)}
                    onPick={close}
                  />
                ))}
              </ul>
            ))}
            <ul className="mt-1 flex justify-center gap-1 border-t border-ivory-faint/30 pt-1">
              {LOOSE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="flex h-11 items-center gap-1.5 rounded-md px-3 text-xs font-semibold hover:bg-night/40"
                  >
                    <item.icon className="size-4" aria-hidden />
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
