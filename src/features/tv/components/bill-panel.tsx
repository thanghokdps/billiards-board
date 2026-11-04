"use client";

import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatVnd } from "@/lib/domain";

import type { TvData } from "../types";
import { PanelHeading } from "./panel-heading";

export function BillPanel({ data }: { data: TvData }) {
  const t = useTranslations("tv.bill");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { bill } = data;

  if (bill.total === 0) {
    return (
      <section>
        <PanelHeading title={t("title")} />
        <EmptyState title={t("empty")} body={t("emptyBody")} className="2xl:py-24" />
      </section>
    );
  }

  return (
    <section>
      <PanelHeading title={t("title")} />
      <div className="felt flex flex-col items-center rounded-xl border border-line px-4 py-8 text-center shadow-card 2xl:py-16">
        <p className="digits digits-glow text-6xl font-bold text-lamp md:text-hero 2xl:text-9xl">
          {formatVnd(bill.total, locale)}
        </p>
      </div>
      <dl className="mt-4 grid gap-4 md:grid-cols-3 2xl:mt-8 2xl:gap-8">
        <div className="rounded-lg border border-line bg-surface p-4 2xl:p-8">
          <dt className="text-xs font-medium text-ivory-muted 2xl:text-2xl">{t("matches")}</dt>
          <dd className="digits text-5xl font-bold 2xl:text-8xl">{tc("matches", { count: bill.matchCount })}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4 2xl:p-8">
          <dt className="text-xs font-medium text-ivory-muted 2xl:text-2xl">{t("average")}</dt>
          <dd className="digits text-5xl font-bold 2xl:text-8xl">{formatVnd(bill.average, locale)}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4 2xl:p-8">
          <dt className="text-xs font-medium text-ivory-muted 2xl:text-2xl">{t("payers")}</dt>
          <dd>
            <ul className="mt-2 space-y-2">
              {bill.payers.map((p) => (
                <li key={p.player.id} className="flex items-center gap-3">
                  <PlayerAvatar player={p.player} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-xl font-bold 2xl:text-3xl">{p.player.name}</span>
                  <span className="digits text-xl font-bold text-lamp 2xl:text-3xl">{formatVnd(p.paid, locale)}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
