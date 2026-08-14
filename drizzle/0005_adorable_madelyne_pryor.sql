ALTER TABLE "quote_line_items" DROP CONSTRAINT "quote_line_items_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_company_quote_fk" FOREIGN KEY ("company_id","quote_id") REFERENCES "public"."quotes"("company_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_customer_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "public"."customers"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_company_id_id_uidx" ON "quotes" USING btree ("company_id","id");