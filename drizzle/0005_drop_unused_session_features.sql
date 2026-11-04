DROP TABLE "prediction_votes" CASCADE;--> statement-breakpoint
DROP TABLE "predictions" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "venue";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "table_label";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "attendees";--> statement-breakpoint
DROP TYPE "public"."prediction_status";