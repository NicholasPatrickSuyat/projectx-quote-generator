CREATE TYPE "public"."user_role" AS ENUM('Admin', 'Office Staff');--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"profile_picture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_email_normalized" CHECK ("app_users"."email" = lower("app_users"."email"))
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_company_email_lower_uidx" ON "app_users" USING btree ("company_id",lower("email"));--> statement-breakpoint
CREATE INDEX "app_users_company_active_idx" ON "app_users" USING btree ("company_id","active");