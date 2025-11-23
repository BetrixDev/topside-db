CREATE TABLE "trader_items_for_sale" (
	"trader_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "trader_items_for_sale_trader_id_item_id_pk" PRIMARY KEY("trader_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "traders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wiki_url" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text NOT NULL,
	"sell_categories" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trader_items_for_sale" ADD CONSTRAINT "trader_items_for_sale_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."traders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trader_items_for_sale" ADD CONSTRAINT "trader_items_for_sale_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;