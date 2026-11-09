import { ArrowRight, MessageCircle, MousePointerClick } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { formatAbsolute, formatRelative } from "../lib/time";
import type { AuditItem } from "../types";

const ACTION_TONE = {
  create: "win",
  update: "lamp",
  delete: "loss",
  restore: "cold",
  approve: "win",
  reject: "loss",
} as const;
const ACTION_DOT = {
  create: "bg-win",
  update: "bg-lamp",
  delete: "bg-loss",
  restore: "bg-cold",
  approve: "bg-win",
  reject: "bg-loss",
} as const;

function isAction(value: string): value is keyof typeof ACTION_TONE {
  return value in ACTION_TONE;
}

/** One log entry: action, entity, actor, channel, a compact before → after, and when. */
export function AuditEntry({ item, now }: { item: AuditItem; now: string }) {
  const t = useTranslations("audit");
  const locale = useLocale();
  // Labels for values the log may hold but this app has no text for yet fall back to the raw name.
  const label = (group: "action" | "entity" | "via" | "actor" | "fields", key: string) =>
    t.has(`${group}.${key}`) ? t(`${group}.${key}`) : key;
  const ViaIcon = item.via === "chat" ? MessageCircle : MousePointerClick;

  return (
    <li className="relative pl-6">
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-4 size-3 rounded-full border-2 border-night ring-2 ring-line-strong",
          isAction(item.action) ? ACTION_DOT[item.action] : "bg-ivory-faint",
        )}
      />
      <article className="rounded-md border border-line bg-surface px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-lamp/35">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isAction(item.action) ? ACTION_TONE[item.action] : "neutral"} size="md">
            {label("action", item.action)}
          </Badge>
          <h3 className="font-display text-lg font-bold leading-tight">{label("entity", item.entity)}</h3>
          <span className="font-mono text-xs text-ivory-faint">{t("shortId", { id: item.shortId })}</span>
          <Badge tone="neutral" className="ml-auto">
            <ViaIcon className="size-3" aria-hidden />
            {label("via", item.via)}
          </Badge>
        </div>

        {item.headline && <p className="mt-2 font-semibold">{item.headline}</p>}

        {item.changes.length > 0 && (
          <dl className="mt-2 space-y-1 text-sm">
            {item.changes.map((change) => (
              <div key={change.key} className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-ivory-faint">{label("fields", change.key)}</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-x-1.5 break-words">
                  {change.from !== null && (
                    <span className={change.to !== null ? "text-loss line-through" : "text-ivory-muted"}>
                      {change.from}
                    </span>
                  )}
                  {change.from !== null && change.to !== null && (
                    <ArrowRight className="size-3.5 text-ivory-faint" aria-hidden />
                  )}
                  {change.to !== null && <span className="font-semibold text-win">{change.to}</span>}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-3 text-xs text-ivory-muted">
          {t("by", { actor: label("actor", item.actor) })} ·{" "}
          <time dateTime={item.createdAt}>{formatRelative(item.createdAt, now, locale)}</time>
          <span className="text-ivory-faint"> · {formatAbsolute(item.createdAt, locale)}</span>
        </p>
      </article>
    </li>
  );
}
