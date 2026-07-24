ALTER TABLE "alerts" ADD COLUMN "last_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "last_value" real;