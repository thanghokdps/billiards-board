CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "match_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"edited" jsonb,
	"submitter" text,
	"ip_hash" text NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "match_submissions" ADD CONSTRAINT "match_submissions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_submissions_status_created_idx" ON "match_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "match_submissions_ip_created_idx" ON "match_submissions" USING btree ("ip_hash","created_at");