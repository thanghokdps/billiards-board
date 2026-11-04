"use client";

import { Copy, Loader2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { AdminApiError } from "@/features/matches";
import { formatVnd } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

import { homeApi } from "../api";
import type { DaySummary } from "../lib/day-summary";

interface RecapCardProps {
  date: string;
  summary: DaySummary;
  admin: boolean;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-2xs font-semibold uppercase tracking-label text-ivory-faint">{label}</dt>
      <dd className="mt-1 min-w-0">{children}</dd>
    </div>
  );
}

function Leaders({ players, hint }: { players: StatPlayer[]; hint: string }) {
  const locale = useLocale();
  const names = new Intl.ListFormat(locale, { type: "conjunction" }).format(players.map((p) => p.name));
  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 -space-x-2">
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="sm" />
        ))}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold leading-tight">{names}</p>
        <p className="truncate text-xs text-ivory-muted">{hint}</p>
      </div>
    </div>
  );
}

/** The deterministic day summary for everyone; the admin can also have the AI write a Slack post from it. */
export function RecapCard({ date, summary, admin }: RecapCardProps) {
  const t = useTranslations("home.recap");
  const locale = useLocale();
  const [text, setText] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);

  async function handleWrite() {
    setWriting(true);
    try {
      setText((await homeApi.recap(date, locale)).text);
    } catch (error) {
      const code = error instanceof AdminApiError ? error.code : "internal";
      toast.error(
        code === "not_found" ? t("noMatches") : code === "unauthenticated" ? t("unauthenticated") : t("failed"),
      );
    } finally {
      setWriting(false);
    }
  }

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <Card className="border-lamp/30">
      <CardBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
          <Fact label={t("matches")}>
            <span className="digits digits-glow text-3xl font-bold leading-none text-lamp">{summary.matchCount}</span>
          </Fact>
          <Fact label={t("totalBill")}>
            <span className="digits text-3xl font-bold leading-none">{formatVnd(summary.totalBill, locale)}</span>
          </Fact>
          <Fact label={t("topWinner")}>
            {summary.topWinners ? (
              <Leaders
                players={summary.topWinners.players}
                hint={t("topWinnerHint", { count: summary.topWinners.value })}
              />
            ) : (
              <span className="text-sm text-ivory-muted">–</span>
            )}
          </Fact>
          <Fact label={t("topPayer")}>
            {summary.topPayers ? (
              <Leaders players={summary.topPayers.players} hint={formatVnd(summary.topPayers.value, locale)} />
            ) : (
              <span className="text-sm text-ivory-muted">{t("noPayer")}</span>
            )}
          </Fact>
        </dl>

        {admin && (
          <div className="space-y-3 border-t border-line pt-4">
            <Button variant="felt" onClick={() => void handleWrite()} disabled={writing} aria-busy={writing}>
              {writing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              {writing ? t("writing") : text ? t("rewrite") : t("ai")}
            </Button>
            <div aria-live="polite" className="space-y-3">
              {text && (
                <>
                  <p className="whitespace-pre-wrap rounded-md border border-line bg-night/60 p-3 text-sm leading-relaxed">
                    <span className="sr-only">{t("textLabel")}: </span>
                    {text}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
                    <Copy className="size-4" aria-hidden />
                    {t("copyPost")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
