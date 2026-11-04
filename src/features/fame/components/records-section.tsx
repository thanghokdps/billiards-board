import { CalendarDays, RotateCcw, Ruler, Swords, Timer, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/misc";
import { formatDate, formatVnd } from "@/lib/domain";
import type { records } from "@/lib/stats";

import { RecordCard } from "./record-card";

export function RecordsSection({ records: found }: { records: ReturnType<typeof records> }) {
  const t = useTranslations("fame");
  const locale = useLocale();
  const { biggestMargin, closest, longest, busiestDay, priciestDay, latestComeback } = found;

  const none = !biggestMargin && !closest && !longest && !busiestDay && !priciestDay && !latestComeback;
  if (none) return <EmptyState title={t("recordsEmpty.title")} body={t("recordsEmpty.body")} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {biggestMargin && (
        <RecordCard
          icon={Swords}
          title={t("record.biggestMargin.title")}
          value={biggestMargin.margin}
          unit={t("record.biggestMargin.unit")}
          match={biggestMargin.match}
          caption={formatDate(biggestMargin.match.date, locale, "long")}
        />
      )}
      {closest && (
        <RecordCard
          icon={Ruler}
          title={t("record.closest.title")}
          value={closest.margin}
          unit={t("record.closest.unit")}
          match={closest.match}
          caption={formatDate(closest.match.date, locale, "long")}
        />
      )}
      {longest && (
        <RecordCard
          icon={Timer}
          title={t("record.longest.title")}
          value={longest.total}
          unit={t("record.longest.unit")}
          match={longest.match}
          caption={formatDate(longest.match.date, locale, "long")}
        />
      )}
      {busiestDay && (
        <RecordCard
          icon={CalendarDays}
          title={t("record.busiestDay.title")}
          value={busiestDay.count}
          unit={t("record.busiestDay.unit")}
          caption={formatDate(busiestDay.date, locale, "long")}
        />
      )}
      {priciestDay && (
        <RecordCard
          icon={Wallet}
          title={t("record.priciestDay.title")}
          value={formatVnd(priciestDay.bill, locale)}
          unit={t("record.priciestDay.unit")}
          caption={formatDate(priciestDay.date, locale, "long")}
        />
      )}
      {latestComeback && (
        <RecordCard
          icon={RotateCcw}
          title={t("record.comeback.title")}
          value="#comeback"
          unit={t("record.comeback.unit")}
          match={latestComeback}
          caption={formatDate(latestComeback.date, locale, "long")}
        />
      )}
    </div>
  );
}
