"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import type { CSSProperties } from "react";

import { Ball } from "@/components/ui/ball";
import { TableFrame } from "@/components/ui/table-frame";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

import { isActive, NAV_ITEMS, type NavItem } from "../nav-items";

const RACKED = NAV_ITEMS.filter((i) => i.ball);
const LOOSE = NAV_ITEMS.filter((i) => !i.ball);
/**
 * A nine-ball rack, row then lane in half ball-widths: a 1-2-3-2-1 diamond with the first ball at the apex and the
 * last, the 9, in the middle, as the rules place them.
 */
const RACK_SEATS = [
  [0, 0],
  [1, -1],
  [1, 1],
  [2, -2],
  [2, 2],
  [3, -1],
  [3, 1],
  [4, 0],
  [2, 0],
];

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
  const [row, lane] = RACK_SEATS[order] ?? [0, 0];
  return (
    <li className="rack-seat" style={{ ["--row" as string]: row, ["--lane" as string]: lane } as CSSProperties}>
      <Link
        href={item.href}
        onClick={onPick}
        aria-current={active ? "page" : undefined}
        style={{ animationDelay: `${order * 25}ms` }}
        className="group flex animate-rack-in flex-col items-center gap-0.5 rounded-md text-center text-2xs font-semibold leading-tight"
      >
        <span
          className={cn(
            "rack-ball relative flex items-center justify-center rounded-full transition-transform duration-150 group-hover:-translate-y-1 group-hover:scale-110 group-active:scale-95",
            active && "shadow-lamp ring-2 ring-lamp ring-offset-2 ring-offset-felt",
          )}
        >
          <Ball color={item.ball} number="" className="size-full drop-shadow-lg" />
          <item.icon className="absolute size-3.5 text-night sm:size-4" aria-hidden />
        </span>
        <span className={cn("rounded-full px-1 py-0.5", active && "bg-night/70 text-lamp")}>{t(item.key)}</span>
      </Link>
    </li>
  );
}

/** Every page as a ball racked on a real table; the 8-ball in the dock breaks it open. */
export function RackMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const close = () => onOpenChange(false);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-fade fixed inset-0 z-50 bg-night/75 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="rack-menu fixed z-50 outline-none">
          <Dialog.Title className="sr-only">{t("mainNav")}</Dialog.Title>
          <div className="rack-table">
            <TableFrame />
          </div>
          <nav aria-label={t("mainNav")} className="rack-field">
            <Dialog.Close
              aria-label={t("closeMenu")}
              className="absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center rounded-full hover:bg-night/40"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
            <ul className="rack-diamond">
              {RACKED.map((item, order) => (
                <RackBall
                  key={item.href}
                  item={item}
                  order={order}
                  active={isActive(pathname, item.href)}
                  onPick={close}
                />
              ))}
            </ul>
            <ul className="rack-loose">
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
