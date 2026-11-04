import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Section } from "@/features/home";
import { buildOracleBoard, OracleBoard, PredictionCard, PredictionCreator, toCardData } from "@/features/predictions";
import { localDate } from "@/lib/domain";
import { isAdmin } from "@/server/auth/session";
import { listPlayers, toPlayerRef } from "@/server/players/repository";
import { getOracleTally, listPredictions } from "@/server/predictions/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "predictions" });
  return { title: t("title") };
}

export default async function PredictionsPage() {
  const [t, admin, everyone, predictions, tally] = await Promise.all([
    getTranslations("predictions"),
    isAdmin(),
    listPlayers({ includeInactive: true }),
    listPredictions(100),
    getOracleTally(),
  ]);

  const byId = new Map(everyone.map((p) => [p.id, toPlayerRef(p)]));
  const roster = everyone.filter((p) => p.active).map(toPlayerRef);
  const cards = predictions.map((p) => toCardData(p, byId)).filter((p) => p !== null);
  const open = cards.filter((p) => p.status === "open");
  const settled = cards.filter((p) => p.status === "settled");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageHeader
        title={t("title")}
        kicker={t("kicker")}
        actions={admin && <PredictionCreator date={localDate(new Date())} roster={roster} />}
      />

      {open.length === 0 && settled.length === 0 ? (
        <EmptyState title={t("emptyTitle")} body={admin ? t("emptyBody") : t("emptyViewerBody")} />
      ) : (
        <Section title={t("open")}>
          {open.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {open.map((p) => (
                <PredictionCard key={p.id} prediction={p} roster={roster} admin={admin} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-ivory-muted">
              {t("noOpen")}
            </p>
          )}
        </Section>
      )}

      <Section title={t("oracle.title")}>
        <OracleBoard rows={buildOracleBoard(tally, byId)} />
      </Section>

      {settled.length > 0 && (
        <Section title={t("settled")}>
          <div className="grid gap-3 md:grid-cols-2">
            {settled.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
