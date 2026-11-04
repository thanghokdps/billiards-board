import { CircleDot, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Ball } from "@/components/ui/ball";
import { formatDate, formatVnd } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

interface TableHeroProps {
  title: string;
  date: string;
  venue: string | null;
  tableLabel: string | null;
  totalBill: number;
  attendees: PlayerRef[];
  /** Admin-only session editor, on the felt beside the title. */
  action?: ReactNode;
}

/** Today's table from above: who is here as their balls on the felt, the day's bill as LED digits. */
export function TableHero({ title, date, venue, tableLabel, totalBill, attendees, action }: TableHeroProps) {
  const t = useTranslations("home.session");
  const locale = useLocale();
  return (
    <section aria-labelledby="table-hero-title" className="table-rail">
      <div className="felt animate-lamp-on space-y-5 rounded-md p-4 shadow-[inset_0_0_32px_rgb(0_0_0/0.45)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 id="table-hero-title" className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm font-medium">{formatDate(date, locale, "long")}</p>
          </div>
          {action}
        </div>

        {attendees.length > 0 ? (
          <div>
            <p className="sr-only">{t("attendees")}</p>
            <ul className="grid grid-cols-5 gap-x-1 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-4">
              {attendees.map((p) => (
                <li key={p.id} className="flex flex-col items-center gap-1 sm:w-14">
                  <Ball color={p.ballColor} number={p.ballNumber} className="size-11 drop-shadow-lg" />
                  <span className="max-w-full truncate text-xs font-semibold">{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Ball className="size-11 shrink-0 drop-shadow-lg" />
            <p className="text-sm">{t("noAttendees")}</p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 space-y-1 text-sm">
            <p className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{venue || t("noVenue")}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <CircleDot className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{tableLabel ? t("table", { label: tableLabel }) : t("noTable")}</span>
            </p>
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
