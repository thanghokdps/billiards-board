import { CircleDot, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatDate, formatVnd } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

interface SessionCardProps {
  date: string;
  venue: string | null;
  tableLabel: string | null;
  totalBill: number;
  attendees: PlayerRef[];
}

/** Date, venue and table, the day's bill as LED digits, and who is here. */
export function SessionCard({ date, venue, tableLabel, totalBill, attendees }: SessionCardProps) {
  const t = useTranslations("home.session");
  const locale = useLocale();
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 space-y-1.5">
            <p className="font-display text-xl font-bold uppercase tracking-wide">{formatDate(date, locale, "long")}</p>
            <p className="flex items-center gap-1.5 text-sm text-ivory-muted">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{venue || t("noVenue")}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-ivory-muted">
              <CircleDot className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{tableLabel ? t("table", { label: tableLabel }) : t("noTable")}</span>
            </p>
          </div>
          <div className="rounded-md bg-night/70 px-4 py-2.5 text-right">
            <p className="text-2xs font-semibold uppercase tracking-label text-ivory-faint">{t("totalBill")}</p>
            <p className="digits digits-glow text-score font-bold text-lamp">{formatVnd(totalBill, locale)}</p>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-label text-ivory-faint">{t("attendees")}</p>
          {attendees.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {attendees.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <PlayerAvatar player={p} size="sm" />
                  <span className="text-sm font-semibold">{p.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ivory-muted">{t("noAttendees")}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
