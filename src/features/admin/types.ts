/** A player as the admin screen edits it (the DB row without bookkeeping columns). */
export interface AdminPlayer {
  id: number;
  slug: string;
  name: string;
  nickname: string | null;
  aliases: string[];
  avatarUrl: string | null;
  ballColor: string;
  ballNumber: number;
  catchphrase: string | null;
  active: boolean;
}

/** Today's lunch session, as far as the admin edits it. */
export interface AdminSession {
  date: string;
  venue: string | null;
  tableLabel: string | null;
}
