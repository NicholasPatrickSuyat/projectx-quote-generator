CREATE TYPE "public"."entity_counter_type" AS ENUM('customer', 'quote');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_number" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company_name" text,
	"phone" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_counters" (
	"company_id" uuid NOT NULL,
	"entity_type" "entity_counter_type" NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_counters_pk" PRIMARY KEY("company_id","entity_type")
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"category" "catalog_category" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"line_total_cents" integer DEFAULT 0 NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_line_items_quantity_positive" CHECK ("quote_line_items"."quantity"::numeric > 0)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"quote_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_snapshot" jsonb NOT NULL,
	"job_description" text DEFAULT '' NOT NULL,
	"status" "quote_status" DEFAULT 'Draft' NOT NULL,
	"quote_date" text NOT NULL,
	"valid_until" text,
	"prepared_by_user_id" uuid,
	"prepared_by" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"customer_message" text DEFAULT '' NOT NULL,
	"terms_and_conditions" text DEFAULT '' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_type" "discount_type" DEFAULT 'none' NOT NULL,
	"discount_value" numeric(12, 4) DEFAULT '0' NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_rate" numeric(8, 4) DEFAULT '0' NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"grand_total_cents" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"status_before_archive" "quote_status",
	"pdf_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_counters" ADD CONSTRAINT "entity_counters_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_prepared_by_user_id_app_users_id_fk" FOREIGN KEY ("prepared_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_company_number_uidx" ON "customers" USING btree ("company_id","customer_number");--> statement-breakpoint
CREATE INDEX "customers_company_archived_idx" ON "customers" USING btree ("company_id","archived");--> statement-breakpoint
CREATE INDEX "customers_company_number_idx" ON "customers" USING btree ("company_id","customer_number");--> statement-breakpoint
CREATE INDEX "customers_company_name_idx" ON "customers" USING btree ("company_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "quote_line_items_quote_sort_idx" ON "quote_line_items" USING btree ("quote_id","sort_order");--> statement-breakpoint
CREATE INDEX "quote_line_items_company_quote_idx" ON "quote_line_items" USING btree ("company_id","quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_company_number_uidx" ON "quotes" USING btree ("company_id","quote_number");--> statement-breakpoint
CREATE INDEX "quotes_company_status_idx" ON "quotes" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "quotes_company_archived_idx" ON "quotes" USING btree ("company_id","archived");--> statement-breakpoint
CREATE INDEX "quotes_company_customer_idx" ON "quotes" USING btree ("company_id","customer_id");--> statement-breakpoint
CREATE INDEX "quotes_company_valid_until_idx" ON "quotes" USING btree ("company_id","valid_until");--> statement-breakpoint
CREATE INDEX "quotes_company_quote_date_idx" ON "quotes" USING btree ("company_id","quote_date");--> statement-breakpoint
CREATE INDEX "quotes_company_number_idx" ON "quotes" USING btree ("company_id","quote_number");