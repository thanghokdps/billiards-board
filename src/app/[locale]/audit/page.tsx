import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/misc";
import { db } from "@/db/client";
import { AuditTimeline, toAuditItem } from "@/features/audit";
import { listAudit } from "@/server/audit/repository";

export const dynamic = "force-dynamic";

const LIMIT = 100;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audit");
  return { title: t("title") };
}

/** Public on purpose: the log exists so nobody can argue about what was changed. Raw ids are shortened. */
export default async function AuditPage() {
  const [t, locale, rows] = await Promise.all([getTranslations("audit"), getLocale(), listAudit(db, LIMIT)]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader title={t("title")} kicker={t("kicker")} />
      <p className="max-w-prose text-sm text-ivory-muted">{t("intro")}</p>
      <AuditTimeline items={rows.map((row) => toAuditItem(row, locale))} now={new Date().toISOString()} />
    </div>
  );
}
