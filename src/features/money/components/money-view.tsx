import { getLocale, getTranslations } from "next-intl/server";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterLinks } from "@/components/ui/filter-links";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatVnd, type Period } from "@/lib/domain";
import type { MoneyBreakdown } from "@/lib/stats";

import { BillChart } from "./bill-chart";
import { Contributors } from "./contributors";
import { GameTypeCosts } from "./game-type-costs";
import { groupTotals } from "../lib/group";
import { GRAINS, PERIODS, type Grain } from "../lib/params";

interface MoneyViewProps {
  money: MoneyBreakdown;
  period: Period;
  grain: Grain;
}

export async function MoneyView({ money, period, grain }: MoneyViewProps) {
  const [t, common, locale] = await Promise.all([getTranslations("money"), getTranslations("common"), getLocale()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterLinks
          label={t("periodLabel")}
          current={period}
          options={PERIODS.map((value) => ({
            value,
            label: common(`period.${value}`),
            href: `/money?period=${value}`,
          }))}
        />
        {money.matchesWithBill > 0 && (
          <FilterLinks
            label={t("grainLabel")}
            current={grain}
            options={GRAINS.map((value) => ({
              value,
              label: t(`grain.${value}`),
              href: `/money?period=${period}&grain=${value}`,
            }))}
          />
        )}
      </div>

      {money.matchesWithBill === 0 ? (
        <EmptyState title={t("empty.title")} body={t("empty.body")} />
      ) : (
        <>
          <section aria-label={t("total")} className="felt rounded-lg border border-line p-5 shadow-card">
            <p className="text-xs font-medium text-ivory-muted">{t("total")}</p>
            <p className="mt-1 inline-block max-w-full rounded-md bg-night/70 px-3 py-1 digits text-score font-bold text-lamp digits-glow sm:text-hero">
              {formatVnd(money.total, locale)}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <p className="text-xs font-medium text-ivory-muted">{t("avg")}</p>
                <p className="digits text-xl font-bold">{formatVnd(money.avgPerMatch, locale)}</p>
              </div>
              <p className="text-sm text-ivory-muted">{t("totalHint", { count: money.matchesWithBill })}</p>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>{t(`chartTitle.${grain}`)}</CardTitle>
            </CardHeader>
            <CardBody>
              <BillChart buckets={groupTotals(money.byDate, grain)} grain={grain} />
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Contributors byPlayer={money.byPlayer} />
            <GameTypeCosts byGameType={money.byGameType} />
          </div>
        </>
      )}
    </div>
  );
}
