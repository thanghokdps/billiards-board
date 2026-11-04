"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminCall } from "@/features/matches";

import { useAdminRun } from "../hooks/use-admin-run";
import type { HighlightItem } from "../types";

interface HighlightGalleryProps {
  matchId: string;
  items: HighlightItem[];
  admin: boolean;
}

export function HighlightGallery({ matchId, items, admin }: HighlightGalleryProps) {
  const t = useTranslations("history");
  const { pending, run } = useAdminRun();

  async function handleRemove(id: number) {
    const ok = await run(async () => {
      await adminCall(`/api/admin/matches/${matchId}/highlights/${id}`, { method: "DELETE" });
    });
    if (ok) toast(t("admin.highlightRemoved"));
  }

  if (items.length === 0) return <p className="text-sm text-ivory-muted">{t("sheet.noHighlights")}</p>;

  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <li key={item.id} className="relative overflow-hidden rounded-md border border-line bg-surface-2">
          {item.kind === "image" ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="relative block aspect-square">
              <Image
                src={item.href}
                alt={item.caption ?? t("sheet.image")}
                fill
                sizes="(min-width: 768px) 240px, 45vw"
                className="object-cover"
                unoptimized
              />
            </a>
          ) : (
            <Button asChild variant="subtle" className="aspect-square h-auto w-full flex-col rounded-none">
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-6" aria-hidden />
                {t("sheet.openClip")}
              </a>
            </Button>
          )}
          {item.caption && <p className="truncate px-2 py-1.5 text-xs text-ivory-muted">{item.caption}</p>}
          {admin && (
            <Button
              variant="danger"
              size="icon-sm"
              className="absolute right-1.5 top-1.5"
              aria-label={t("admin.removeHighlight")}
              disabled={pending}
              onClick={() => void handleRemove(item.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
