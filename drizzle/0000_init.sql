CREATE TYPE "public"."game_type" AS ENUM('3c_real', '3c_fake', 'libre');--> statement-breakpoint
CREATE TYPE "public"."match_format" AS ENUM('1v1', '2v2');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"via" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"match_id" uuid,
	"player_id" integer,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"match_id" uuid NOT NULL,
	"player_id" integer NOT NULL,
	"side" "side" NOT NULL,
	CONSTRAINT "match_players_match_id_player_id_pk" PRIMARY KEY("match_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" integer NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"game_type" "game_type" NOT NULL,
	"format" "match_format" NOT NULL,
	"score_a" integer,
	"score_b" integer,
	"winner_side" "side" NOT NULL,
	"bill" integer,
	"note" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"avatar_url" text,
	"ball_color" text NOT NULL,
	"ball_number" integer NOT NULL,
	"catchphrase" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"venue" text,
	"table_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "matches_session_idx" ON "matches" USING btree ("session_id");