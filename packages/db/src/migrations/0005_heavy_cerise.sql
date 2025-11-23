ALTER TABLE "trader_items_for_sale" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trader_items_for_sale" ADD COLUMN "quantity_per_sale" integer DEFAULT 1 NOT NULL;