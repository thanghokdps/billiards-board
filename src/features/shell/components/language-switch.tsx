"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const LANGS = [
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "en", label: "EN", name: "English" },
] as const;

/** VI | EN toggle; next-intl stores the choice in its locale cookie, so the browser remembers it. */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={tc("language")}
      className={cn("flex rounded-full border border-line bg-surface p-0.5", className)}
    >
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          lang={lang.code}
          aria-pressed={locale === lang.code}
          aria-label={t("switchTo", { language: lang.name })}
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              const query = search.toString();
              router.replace(`${pathname}${query ? `?${query}` : ""}`, { locale: lang.code, scroll: false });
            })
          }
          className={cn(
            "h-7 rounded-full px-2.5 font-display text-xs font-bold tracking-wider transition-colors",
            locale === lang.code ? "bg-ivory text-night" : "text-ivory-muted hover:text-ivory",
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
