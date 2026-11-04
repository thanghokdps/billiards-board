import { useLocale, useTranslations } from "next-intl";

import { RollingNumber } from "@/components/ui/rolling-number";
import { formatDate, formatVnd } from "@/lib/domain";

import { PoolGame } from "./pool-game";

interface TableHeroProps {
  title: string;
  date: string;
  totalBill: number;
}

/** Today's headline beside a table you can play on: above it on narrow screens, in a side column on wide ones. */
export function TableHero({ title, date, totalBill }: TableHeroProps) {
  const t = useTranslations("home.session");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="table-hero-title"
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center lg:gap-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 lg:order-2 lg:flex-col lg:items-start lg:gap-8">
        <div className="min-w-0">
          <h1 id="table-hero-title" className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-ivory-muted">{formatDate(date, locale, "long")}</p>
        </div>
        <div className="ml-auto text-right lg:ml-0 lg:text-left">
          <p className="text-xs font-medium text-ivory-muted">{t("totalBill")}</p>
          <p className="digits digits-glow text-4xl font-extrabold leading-none text-lamp sm:text-5xl">
            <RollingNumber value={formatVnd(totalBill, locale)} />
          </p>
        </div>
      </div>
      <PoolGame />
    </section>
  );
}
