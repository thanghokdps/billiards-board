import { useLocale, useTranslations } from "next-intl";

import { formatDate, formatVnd } from "@/lib/domain";

interface TableHeroProps {
  title: string;
  date: string;
  totalBill: number;
}

/** Today's table from above: the date on the felt, the day's bill as LED digits. */
export function TableHero({ title, date, totalBill }: TableHeroProps) {
  const t = useTranslations("home.session");
  const locale = useLocale();
  return (
    <section aria-labelledby="table-hero-title" className="table-rail">
      <div className="felt animate-lamp-on rounded-md p-4 shadow-[inset_0_0_32px_rgb(0_0_0/0.45)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
          <div className="min-w-0">
            <h1 id="table-hero-title" className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm font-medium">{formatDate(date, locale, "long")}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-medium">{t("totalBill")}</p>
            <p className="digits digits-glow text-6xl font-extrabold leading-none text-lamp sm:text-hero">
              {formatVnd(totalBill, locale)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
