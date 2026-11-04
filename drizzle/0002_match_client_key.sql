ALTER TABLE "matches" ADD COLUMN "client_key" text;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_client_key_unique" UNIQUE("client_key");