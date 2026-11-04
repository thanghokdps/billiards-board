import type { Highlight } from "@/db/schema";

import type { HighlightItem } from "../types";

/** Rows without a photo or a link (media deleted, `set null`) have nothing to show and are dropped. */
export function toHighlightItems(rows: Highlight[]): Record<string, HighlightItem[]> {
  const byMatch: Record<string, HighlightItem[]> = {};
  for (const row of rows) {
    const href = row.mediaId ? `/api/media/${row.mediaId}` : row.url;
    if (!href) continue;
    (byMatch[row.matchId] ??= []).push({
      id: row.id,
      matchId: row.matchId,
      caption: row.caption,
      kind: row.mediaId ? "image" : "link",
      href,
    });
  }
  return byMatch;
}
