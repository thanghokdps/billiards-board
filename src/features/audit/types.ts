/** One changed field, values already formatted as text; `null` means "this side does not exist" (create / delete). */
export interface AuditChange {
  key: string;
  from: string | null;
  to: string | null;
}

/** An audit row as the browser gets it: no raw before/after JSON, only what the timeline shows. */
export interface AuditItem {
  id: number;
  actor: string;
  via: string;
  action: string;
  entity: string;
  /** Short form of the entity id (8 chars of a uuid, `#12` for a number). */
  shortId: string;
  /** "Thén vs Dũ" for a match, the name for a player, else null. */
  headline: string | null;
  changes: AuditChange[];
  createdAt: string;
}
