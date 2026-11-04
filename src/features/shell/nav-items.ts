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
  /** Shown in the phone tab bar (the rest live in "More"). */
  tab?: boolean;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "home", icon: House, tab: true },
  { href: "/history", key: "history", icon: CalendarDays, tab: true },
  { href: "/leaderboard", key: "leaderboard", icon: Trophy, tab: true },
  { href: "/money", key: "money", icon: Wallet },
  { href: "/hall-of-fame", key: "fame", icon: Crown },
  { href: "/rivalry", key: "rivalry", icon: Swords },
  { href: "/wheel", key: "wheel", icon: Disc3 },
  { href: "/predictions", key: "predictions", icon: Target },
  { href: "/wrapped", key: "wrapped", icon: Gift },
  { href: "/tv", key: "tv", icon: Tv },
  { href: "/audit", key: "audit", icon: ScrollText },
  { href: "/admin", key: "admin", icon: Shield },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
