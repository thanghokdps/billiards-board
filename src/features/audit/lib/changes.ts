import { formatVnd, GAME_LABEL, GUEST_SEAT } from "@/lib/domain";

import type { AuditChange, AuditItem } from "../types";

/** Bookkeeping fields: they change on every write and say nothing about what was edited. */
const NOISE = new Set(["id", "createdAt", "updatedAt", "deletedAt", "playedAt", "deleted", "sessionId"]);
const EMPTY = "—";
const MAX_LENGTH = 60;
/** A create or delete lists the first few facts only; the whole record would bury the timeline. */
const MAX_FACTS = 5;

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row => typeof value === "object" && value !== null && !Array.isArray(value);

const clip = (text: string) => (text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text);

function isEmpty(value: unknown): boolean {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function formatValue(key: string, value: unknown, locale: string): string {
  if (isEmpty(value)) return EMPTY;
  if (key === "bill" && typeof value === "number") return formatVnd(value, locale);
  if (key === "gameType" && typeof value === "string") return GAME_LABEL[value as keyof typeof GAME_LABEL] ?? value; // value is audit JSON, may predate a renamed type
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (key === "scores" && Array.isArray(value)) return value.map((v) => (isRow(v) ? String(v.score) : "?")).join(" · ");
  if (Array.isArray(value)) {
    const parts = value.map((v) =>
      isRow(v) && typeof v.name === "string" ? v.name : typeof v === "object" ? JSON.stringify(v) : String(v),
    );
    return clip(parts.join(key.startsWith("side") ? " & " : ", "));
  }
  if (typeof value === "object") return clip(JSON.stringify(value));
  return clip(String(value));
}

function sideNames(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const names = value.flatMap((v) => (isRow(v) && typeof v.name === "string" ? [v.name] : []));
  return names.length ? names.join(" & ") : null;
}

/** Match: "A vs B"; player: the name. Anything else has no useful one-line title. */
function headlineOf(entity: string, snapshot: unknown): string | null {
  if (!isRow(snapshot)) return null;
  if (entity === "match") {
    const a = sideNames(snapshot.sideA);
    const b = snapshot.format === "guest" ? GUEST_SEAT.name : sideNames(snapshot.sideB);
    if (!a || !b) return null;
    return snapshot.format === "1v1v1" ? `${a.replace(" & ", " vs ")} vs ${b}` : `${a} vs ${b}`;
  }
  return entity === "player" && typeof snapshot.name === "string" ? snapshot.name : null;
}

function changesOf(action: string, before: unknown, after: unknown, locale: string): AuditChange[] {
  const bothRows = isRow(before) && isRow(after);
  if (bothRows && action === "update") {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys]
      .filter((key) => !NOISE.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map((key) => ({ key, from: formatValue(key, before[key], locale), to: formatValue(key, after[key], locale) }));
  }
  // A restore only flips `deleted`, which the action badge already says.
  const snapshot = action === "create" ? after : action === "delete" ? before : null;
  if (!isRow(snapshot)) return [];
  return Object.entries(snapshot)
    .filter(([key, value]) => !NOISE.has(key) && !isEmpty(value))
    .slice(0, MAX_FACTS)
    .map(([key, value]) => {
      const text = formatValue(key, value, locale);
      return action === "create" ? { key, from: null, to: text } : { key, from: text, to: null };
    });
}

export function shortIdOf(entityId: string): string {
  return /^\d+$/.test(entityId) ? `#${entityId}` : entityId.slice(0, 8);
}

interface AuditRow {
  id: number;
  actor: string;
  via: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

export function toAuditItem(row: AuditRow, locale: string): AuditItem {
  return {
    id: row.id,
    actor: row.actor,
    via: row.via,
    action: row.action,
    entity: row.entity,
    shortId: shortIdOf(row.entityId),
    headline: headlineOf(row.entity, row.after ?? row.before),
    changes: changesOf(row.action, row.before, row.after, locale),
    createdAt: row.createdAt.toISOString(),
  };
}
