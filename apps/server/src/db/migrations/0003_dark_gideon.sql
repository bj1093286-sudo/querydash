CREATE TABLE "query_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sql_text" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "folder" text;--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "query_versions" ADD CONSTRAINT "query_versions_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_versions" ADD CONSTRAINT "query_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;