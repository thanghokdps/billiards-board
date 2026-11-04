import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { APP_TIMEZONE } from "@/lib/domain";

import { NAMESPACES } from "./namespaces";
import { routing } from "./routing";

// Route handlers (posters, recap) have no root params yet, so they pass `locale` explicitly.
export default getRequestConfig(async ({ locale: explicit }) => {
  const requested = explicit ?? (await rootParams.locale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const entries = await Promise.all(
    NAMESPACES.map(
      async (ns) =>
        [ns, (await import(`../../messages/${locale}/${ns}.json`)).default as Record<string, unknown>] as const,
    ),
  );
  return {
    locale,
    timeZone: APP_TIMEZONE,
    messages: Object.fromEntries(entries),
  };
});
