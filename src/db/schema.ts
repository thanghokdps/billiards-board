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
export const matchFormatEnum = pgEnum("match_format", ["1v1", "2v2"]);
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  /** Local date of the lunch session (Asia/Ho_Chi_Minh). */
  date: date("date").notNull().unique(),
  venue: text("venue"),
  tableLabel: text("table_label"),
  /** Player ids marked as coming ("trưa nay ai đi?"); empty = not asked yet. */
  attendees: integer("attendees")
    .array()
    .notNull()
    .default(sql`'{}'::integer[]`),
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

export const predictionStatusEnum = pgEnum("prediction_status", ["open", "settled", "cancelled"]);

/** A fun pre-match poll ("kèo"), no real money. Settled automatically when the matching match is recorded. */
export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    gameType: gameTypeEnum("game_type"),
    sideA: integer("side_a").array().notNull(),
    sideB: integer("side_b").array().notNull(),
    status: predictionStatusEnum("status").notNull().default("open"),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
    winnerSide: sideEnum("winner_side"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("predictions_date_idx").on(t.date), index("predictions_match_idx").on(t.matchId)],
);

export const predictionVotes = pgTable(
  "prediction_votes",
  {
    predictionId: integer("prediction_id")
      .notNull()
      .references(() => predictions.id, { onDelete: "cascade" }),
    voterId: integer("voter_id")
      .notNull()
      .references(() => players.id),
    pick: sideEnum("pick").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.predictionId, t.voterId] }), index("prediction_votes_voter_idx").on(t.voterId)],
);

export type Player = typeof players.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type Highlight = typeof highlights.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MatchRow = typeof matches.$inferSelect;
export type GameType = (typeof gameTypeEnum.enumValues)[number];
export type MatchFormat = (typeof matchFormatEnum.enumValues)[number];
export type Side = (typeof sideEnum.enumValues)[number];
export const GAME_TYPES = gameTypeEnum.enumValues;
