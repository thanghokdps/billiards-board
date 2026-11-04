import { ArrowRight, Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function WrappedCard() {
  const t = useTranslations("fame.wrapped");
  return (
    <Link
      href="/wrapped"
      className="felt group flex items-center gap-4 rounded-lg border border-lamp/40 p-5 shadow-lamp transition-transform active:scale-[0.99]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lamp text-night">
        <Gift className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-3xl font-bold leading-tight">{t("title")}</span>
        <span className="block text-sm text-ivory-muted">{t("body")}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-lamp">
        <span className="hidden sm:inline">{t("cta")}</span>
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
