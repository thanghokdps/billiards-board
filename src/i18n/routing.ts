import { defineRouting } from "next-intl/routing";

/** /vi (default) and /en; the choice is remembered by next-intl's locale cookie per browser. */
export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
