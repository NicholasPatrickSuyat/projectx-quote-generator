CREATE TYPE "public"."catalog_category" AS ENUM('Services', 'Materials', 'Labor');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('none', 'percent', 'fixed');--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "catalog_category" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"unit" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"logo_json" jsonb,
	"currency" text DEFAULT 'USD' NOT NULL,
	"tax_rate" numeric(8, 4) NOT NULL,
	"quote_validity_days" integer NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(12, 4) NOT NULL,
	"prepared_by" text DEFAULT '' NOT NULL,
	"customer_facing_message" text NOT NULL,
	"terms_and_conditions" text NOT NULL,
	"pdf_footer_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_settings_currency_usd" CHECK ("company_settings"."currency" = 'USD')
);
--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_items_company_id_idx" ON "catalog_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "catalog_items_company_archived_idx" ON "catalog_items" USING btree ("company_id","archived");--> statement-breakpoint
CREATE INDEX "catalog_items_company_category_idx" ON "catalog_items" USING btree ("company_id","category");--> statement-breakpoint
CREATE INDEX "catalog_items_company_name_idx" ON "catalog_items" USING btree ("company_id","name");