"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/misc";

import type { AuditItem } from "../types";
import { AuditEntry } from "./audit-entry";

interface AuditTimelineProps {
  items: AuditItem[];
  /** Server render time (ISO), the fixed point for "3 hours ago". */
  now: string;
}

export function AuditTimeline({ items, now }: AuditTimelineProps) {
  const t = useTranslations("audit");
  const [entity, setEntity] = useState<string | null>(null);

  if (items.length === 0) return <EmptyState title={t("empty.title")} body={t("empty.body")} />;

  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.entity, (counts.get(item.entity) ?? 0) + 1);
  const shown = entity ? items.filter((item) => item.entity === entity) : items;
  const entityLabel = (key: string) => (t.has(`entity.${key}`) ? t(`entity.${key}`) : key);

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("filter")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip selected={entity === null} onClick={() => setEntity(null)}>
          {t("all")} <span className="digits text-xs">{items.length}</span>
        </Chip>
        {[...counts].map(([key, count]) => (
          <Chip key={key} selected={entity === key} onClick={() => setEntity(key)}>
            {entityLabel(key)} <span className="digits text-xs">{count}</span>
          </Chip>
        ))}
      </div>

      <p aria-live="polite" className="text-sm text-ivory-muted">
        {t("count", { count: shown.length })}
      </p>

      <ol className="relative space-y-3 before:absolute before:inset-y-2 before:left-1.5 before:w-px before:bg-line-strong">
        {shown.map((item) => (
          <AuditEntry key={item.id} item={item} now={now} />
        ))}
      </ol>

      <p className="text-xs text-ivory-faint">{t("limit")}</p>
    </div>
  );
}
