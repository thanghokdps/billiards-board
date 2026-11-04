import "server-only";

import { desc } from "drizzle-orm";

import type { db as Database } from "@/db/client";
import { auditLog } from "@/db/schema";

type Tx = Pick<typeof Database, "insert" | "select">;

export interface AuditEntry {
  actor: string;
  via: "chat" | "ui";
  action: "create" | "update" | "delete" | "restore";
  entity: "match" | "player" | "session" | "prediction" | "highlight";
  entityId: string;
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  await tx.insert(auditLog).values({
    actor: entry.actor,
    via: entry.via,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
}

export async function listAudit(tx: Tx, limit = 50) {
  return tx.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(Math.min(limit, 200));
}
