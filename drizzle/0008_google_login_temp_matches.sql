ALTER TYPE "public"."submission_status" ADD VALUE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "match_submissions" ALTER COLUMN "ip_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_submissions" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "match_submissions" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "match_submissions" ADD CONSTRAINT "match_submissions_created_by_players_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_submissions_created_by_idx" ON "match_submissions" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_email_unique" UNIQUE("email");