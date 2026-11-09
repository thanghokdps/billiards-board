import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const gameTypeEnum = pgEnum("game_type", ["3c_real", "3c_fake", "libre"]);
export const matchFormatEnum = pgEnum("match_format", ["1v1", "2v2", "1v1v1", "guest"]);
export const sideEnum = pgEnum("side", ["a", "b"]);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  /** Extra names the chatbot maps to this player ("thằng Hi", "Lâm béo"). */
  aliases: text("aliases")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  avatarUrl: text("avatar_url"),
  /** Ball colour used across charts and avatars. */
  ballColor: text("ball_color").notNull(),
  ballNumber: integer("ball_number").notNull(),
  catchphrase: text("catchphrase"),
  active: boolean("active").notNull().default(true),
  /** A named guest: plays any format but earns no Elo and stays off the leaderboards. */
  guest: boolean("guest").notNull().default(false),
  /** Admin-only remark (who the guest is); never part of PlayerRef. */
  note: text("note"),
  /** Google sign-in email, stored lowercase; only members with one can sign in. Never part of PlayerRef. */
  email: text("email").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  /** Local date of the lunch session (Asia/Ho_Chi_Minh). */
  date: date("date").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
    gameType: gameTypeEnum("game_type").notNull(),
    format: matchFormatEnum("format").notNull(),
    scoreA: integer("score_a"),
    scoreB: integer("score_b"),
    winnerSide: sideEnum("winner_side").notNull(),
    /** Table bill in VND, already paid; statistics only. */
    bill: integer("bill"),
    note: text("note"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Idempotency key from the confirm card (`<toolCallId>:<index>`), so a double tap saves once. */
    clientKey: text("client_key").unique(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("matches_played_at_idx").on(t.playedAt), index("matches_session_idx").on(t.sessionId)],
);

export const matchPlayers = pgTable(
  "match_players",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id),
    side: sideEnum("side").notNull(),
    /** A 1v1v1 player's own score; 1v1 and 2v2 keep theirs in matches.score_a/score_b. */
    score: integer("score"),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.playerId] })],
);

/** Timeline of notable moments: streaks broken, records, achievements, posters. */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id").references(() => players.id),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_created_idx").on(t.createdAt)],
);

/** Every write: who, when, what before and after — so nobody can "cheat". */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    actor: text("actor").notNull(),
    via: text("via").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

/** Admin-uploaded images (avatars, highlight photos), resized client-side; small enough to live in Postgres. */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A photo or clip link attached to a match. */
export const highlights = pgTable(
  "highlights",
  {
    id: serial("id").primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").references(() => media.id, { onDelete: "set null" }),
    url: text("url"),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("highlights_match_idx").on(t.matchId)],
);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "scheduled",
  "cancelled",
]);

/**
 * A temp match a signed-in member created: `scheduled` (no result yet) → `pending` (result in) → the admin
 * approves it into a `matches` row, or rejects it. Rows from the old anonymous form have `ip_hash` set.
 */
export const matchSubmissions = pgTable(
  "match_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    /** The submitted body, validated by `submissionInputSchema` (seats are `{ playerId }` or `{ guestName }`). */
    payload: jsonb("payload").notNull(),
    /** The admin's corrected body, set on "edit then approve"; the payload stays as submitted. */
    edited: jsonb("edited"),
    submitter: text("submitter"),
    /** HMAC of the client IP (old anonymous rows only); the raw IP is never stored. */
    ipHash: text("ip_hash"),
    /** The member who created it; null on old anonymous rows. */
    createdBy: integer("created_by").references(() => players.id, { onDelete: "set null" }),
    /** When the players plan to play; optional. */
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    index("match_submissions_status_created_idx").on(t.status, t.createdAt),
    index("match_submissions_ip_created_idx").on(t.ipHash, t.createdAt),
    index("match_submissions_created_by_idx").on(t.createdBy),
  ],
);

export type Player = typeof players.$inferSelect;
export type MatchSubmissionRow = typeof matchSubmissions.$inferSelect;
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
export type Highlight = typeof highlights.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MatchRow = typeof matches.$inferSelect;
export type GameType = (typeof gameTypeEnum.enumValues)[number];
export type MatchFormat = (typeof matchFormatEnum.enumValues)[number];
export type Side = (typeof sideEnum.enumValues)[number];
export const GAME_TYPES = gameTypeEnum.enumValues;
