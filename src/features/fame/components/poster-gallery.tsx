"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { formatDate } from "@/lib/domain";
import type { SpecialReason } from "@/lib/stats";

import { PosterImage } from "./poster-image";

export interface GalleryPoster {
  matchId: string;
  reason: SpecialReason;
  date: string;
  /** "Duy & Nam vs Hà", already joined for the label. */
  sides: string;
  src: string;
}

/** Thumbnails of special-match posters; a tap opens the full image in a Sheet with a download button. */
export function PosterGallery({ posters }: { posters: GalleryPoster[] }) {
  const t = useTranslations("fame");
  const common = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState<GalleryPoster | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {posters.map((poster, i) => (
          <li key={poster.matchId} className="min-w-0">
            <Button
              variant="ghost"
              aria-label={t("posterOpen", { sides: poster.sides })}
              onClick={() => setOpen(poster)}
              className="h-auto w-full flex-col items-stretch gap-2 whitespace-normal rounded-md p-0 text-left hover:bg-transparent"
            >
              <PosterImage
                src={poster.src}
                alt={t("posterAlt", { sides: poster.sides })}
                errorLabel={t("posterError")}
                sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"
                eager={i < 4}
                className="border border-line"
              />
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge tone="lamp">{t(`reason.${poster.reason}`)}</Badge>
                <time dateTime={poster.date} className="text-2xs text-ivory-muted">
                  {formatDate(poster.date, locale)}
                </time>
              </span>
            </Button>
          </li>
        ))}
      </ul>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
        title={open ? t("posterSheet", { date: formatDate(open.date, locale, "long") }) : ""}
        side="responsive"
      >
        {open && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
            <PosterImage
              src={open.src}
              alt={t("posterAlt", { sides: open.sides })}
              errorLabel={t("posterError")}
              sizes="(min-width: 768px) 512px, 100vw"
              className="mx-auto max-w-sm"
            />
            <Button asChild className="mx-auto">
              <a href={open.src} download={`poster-${open.matchId}.png`}>
                <Download className="size-4" aria-hidden />
                {common("download")}
              </a>
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
