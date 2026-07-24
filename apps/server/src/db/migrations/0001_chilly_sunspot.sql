ALTER TABLE "alerts" DROP CONSTRAINT "alerts_query_id_queries_id_fk";
--> statement-breakpoint
ALTER TABLE "query_results" DROP CONSTRAINT "query_results_query_id_queries_id_fk";
--> statement-breakpoint
ALTER TABLE "visualizations" DROP CONSTRAINT "visualizations_query_id_queries_id_fk";
--> statement-breakpoint
ALTER TABLE "widgets" DROP CONSTRAINT "widgets_dashboard_id_dashboards_id_fk";
--> statement-breakpoint
ALTER TABLE "widgets" DROP CONSTRAINT "widgets_visualization_id_visualizations_id_fk";
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_results" ADD CONSTRAINT "query_results_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visualizations" ADD CONSTRAINT "visualizations_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_visualization_id_visualizations_id_fk" FOREIGN KEY ("visualization_id") REFERENCES "public"."visualizations"("id") ON DELETE cascade ON UPDATE no action;