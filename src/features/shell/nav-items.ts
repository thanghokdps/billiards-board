import {
  CalendarDays,
  Crown,
  Gift,
  House,
  ScrollText,
  Shield,
  Swords,
  Target,
  Trophy,
  Tv,
  Wallet,
  Disc3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  /** Shown in the floating dock. */
  tab?: boolean;
  /** Ball colour token in the rack. Pages without one are plain links under it. */
  ball?: string;
}

export const WHEEL_ITEM: NavItem = {
  href: "/wheel",
  key: "wheel",
  icon: Disc3,
  ball: "var(--color-pool-orange)",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "home", icon: House, tab: true, ball: "var(--color-pool-yellow)" },
  { href: "/history", key: "history", icon: CalendarDays, tab: true, ball: "var(--color-pool-blue)" },
  { href: "/leaderboard", key: "leaderboard", icon: Trophy, tab: true, ball: "var(--color-pool-red)" },
  { href: "/money", key: "money", icon: Wallet, ball: "var(--color-pool-purple)" },
  { href: "/hall-of-fame", key: "fame", icon: Crown, ball: "var(--color-pool-pink)" },
  { href: "/rivalry", key: "rivalry", icon: Swords, ball: "var(--color-pool-maroon)" },
  WHEEL_ITEM,
  { href: "/predictions", key: "predictions", icon: Target, ball: "var(--color-pool-green)" },
  { href: "/wrapped", key: "wrapped", icon: Gift, ball: "var(--color-pool-teal)" },
  { href: "/tv", key: "tv", icon: Tv, ball: "var(--color-pool-ivory)" },
  { href: "/audit", key: "audit", icon: ScrollText },
  { href: "/admin", key: "admin", icon: Shield },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
