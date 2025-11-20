CREATE TABLE "item_effects" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"name" text NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "item_recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_recycles" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_salvages" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"type" text,
	"value" real,
	"rarity" text,
	"weight_kg" real,
	"stack_size" integer DEFAULT 1,
	"image_filename" text,
	"craft_bench" text,
	"updated_at" text
);
--> statement-breakpoint
ALTER TABLE "item_effects" ADD CONSTRAINT "item_effects_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recipes" ADD CONSTRAINT "item_recipes_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recycles" ADD CONSTRAINT "item_recycles_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_salvages" ADD CONSTRAINT "item_salvages_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;