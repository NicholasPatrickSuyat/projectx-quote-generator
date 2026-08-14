CREATE TABLE "login_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dimension" text NOT NULL,
	"key_hash" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "login_rate_limits_dimension_key_uidx" ON "login_rate_limits" USING btree ("dimension","key_hash");--> statement-breakpoint
CREATE INDEX "login_rate_limits_updated_at_idx" ON "login_rate_limits" USING btree ("updated_at");