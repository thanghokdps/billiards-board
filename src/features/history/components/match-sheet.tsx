"use client";

import { ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { MatchRow } from "@/components/ui/match-row";
import { Sheet } from "@/components/ui/sheet";
import { formatDate, formatTime } from "@/lib/domain";

import type { HighlightItem, HistoryMatch } from "../types";
import { HighlightForm } from "./highlight-form";
import { HighlightGallery } from "./highlight-gallery";
import { MatchAdminActions } from "./match-admin-actions";

interface MatchSheetProps {
  match: HistoryMatch | null;
  highlights: HighlightItem[];
  admin: boolean;
  onClose: () => void;
}

/** Full detail of one match: scoreboard, note, highlights, poster, and (admin only) the write controls. */
export function MatchSheet({ match, highlights, admin, onClose }: MatchSheetProps) {
  const t = useTranslations("history");
  const locale = useLocale();
  const shortId = match?.id.slice(0, 8) ?? "";

  return (
    <Sheet open={match !== null} onOpenChange={(open) => !open && onClose()} title={t("sheet.title")} side="responsive">
      {match && (
        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-8 pt-3">
          <p className="text-sm text-ivory-muted">
            {formatDate(match.date, locale, "long")} · {formatTime(match.playedAt, locale)} ·{" "}
            <span className="font-mono text-xs text-ivory-faint">{t("sheet.shortId", { id: shortId })}</span>
          </p>

          <MatchRow match={match} />

          <Button asChild variant="outline" className="w-full">
            <a href={`/api/poster/match/${match.id}?locale=${locale}`} target="_blank" rel="noopener noreferrer">
              <ImageIcon className="size-4" aria-hidden />
              {t("sheet.poster")}
            </a>
          </Button>

          <section aria-labelledby="sheet-highlights" className="space-y-3">
            <h3 id="sheet-highlights" className="font-display text-xl font-bold leading-tight">
              {t("sheet.highlights")}
            </h3>
            <HighlightGallery matchId={match.id} items={highlights} admin={admin} />
          </section>

          {admin && (
            <section aria-labelledby="sheet-admin" className="space-y-5 border-t border-line pt-5">
              <h3 id="sheet-admin" className="font-display text-xl font-bold leading-tight text-lamp">
                {t("admin.heading")}
              </h3>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("admin.addHighlight")}</h4>
                <HighlightForm matchId={match.id} />
              </div>
              <MatchAdminActions matchId={match.id} shortId={shortId} onDone={onClose} />
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
