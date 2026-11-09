import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import { usePathname } from "@/i18n/navigation";

/** The page the visitor is on, locale included, for the sign-in round trip; a stale `?login=` result is dropped. */
export function useReturnTo(): string {
  const locale = useLocale();
  const pathname = usePathname();
  const search = new URLSearchParams(useSearchParams());
  search.delete("login");
  const query = search.toString();
  return `/${locale}${pathname === "/" ? "" : pathname}${query ? `?${query}` : ""}`;
}
