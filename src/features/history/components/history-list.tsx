"use client";

import { Images } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MatchRow } from "@/components/ui/match-row";
import { formatDate, formatVnd, matchTitle } from "@/lib/domain";

import type { HighlightItem, HistoryDay } from "../types";
import { MatchSheet } from "./match-sheet";

interface HistoryListProps {
  days: HistoryDay[];
  highlights: Record<string, HighlightItem[]>;
  admin: boolean;
}

const NO_HIGHLIGHTS: HighlightItem[] = [];

/** Days newest first, each with a sticky header; a tap on a match opens its detail sheet. */
export function HistoryList({ days, highlights, admin }: HistoryListProps) {
  const t = useTranslations("history");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = days.flatMap((d) => d.matches).find((m) => m.id === selectedId) ?? null;

  return (
    <>
      <div className="space-y-6">
        {days.map((day) => (
          <section key={day.date} aria-labelledby={`day-${day.date}`}>
            <header className="sticky top-(--header-h) z-10 -mx-4 flex items-baseline justify-between gap-3 border-b border-line bg-night/90 px-4 py-2 backdrop-blur-md">
              <h2 id={`day-${day.date}`} className="font-display text-xl font-bold leading-tight">
                {formatDate(day.date, locale, "long")}
              </h2>
              <p className="shrink-0 text-xs text-ivory-muted">
                {tc("matches", { count: day.matches.length })} ·{" "}
                <span className="digits font-bold text-lamp">{formatVnd(day.bill, locale)}</span>
              </p>
            </header>
            <ul className="divide-y divide-line">
              {day.matches.map((match) => {
                const count = highlights[match.id]?.length ?? 0;
                return (
                  <li key={match.id} className="relative">
                    <MatchRow
                      match={match}
                      footer={
                        count > 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-lamp">
                            <Images className="size-4" aria-hidden />
                            {t("highlightCount", { count })}
                          </p>
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      className="absolute inset-0 h-full w-full rounded-md px-0 hover:bg-lamp/5"
                      aria-label={t("openMatch", { title: matchTitle(match) })}
                      onClick={() => setSelectedId(match.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <MatchSheet
        match={selected}
        highlights={(selected && highlights[selected.id]) || NO_HIGHLIGHTS}
        admin={admin}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
