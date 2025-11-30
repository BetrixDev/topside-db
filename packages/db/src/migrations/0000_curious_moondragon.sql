CREATE TABLE "arc_loot_items" (
	"arc_id" text NOT NULL,
	"item_id" text NOT NULL,
	CONSTRAINT "arc_loot_items_arc_id_item_id_pk" PRIMARY KEY("arc_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "arcs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wiki_url" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text NOT NULL,
	"health" integer,
	"armor_plating" text,
	"threat_level" text,
	"attacks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weaknesses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"destroy_xp" integer,
	"loot_xp" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hideout_station_level_requirements" (
	"hideout_station_id" text NOT NULL,
	"level" integer NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "hideout_station_level_requirements_hideout_station_id_level_item_id_pk" PRIMARY KEY("hideout_station_id","level","item_id")
);
--> statement-breakpoint
CREATE TABLE "hideout_station_levels" (
	"hideout_station_id" text NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "hideout_station_levels_hideout_station_id_level_pk" PRIMARY KEY("hideout_station_id","level")
);
--> statement-breakpoint
CREATE TABLE "hideout_stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_level" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_recipes" (
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"craft_bench" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "item_recipes_item_id_material_id_pk" PRIMARY KEY("item_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "item_recycles" (
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "item_recycles_item_id_material_id_pk" PRIMARY KEY("item_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "item_salvages" (
	"item_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "item_salvages_item_id_material_id_pk" PRIMARY KEY("item_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text,
	"value" real,
	"rarity" text,
	"weight_kg" real,
	"stack_size" integer DEFAULT 1,
	"image_filename" text,
	"craft_bench" jsonb DEFAULT '[]'::jsonb,
	"updated_at" text,
	"effects" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wiki_url" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text,
	"maximum_time_minutes" integer NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"difficulties" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "quest_next_quests" (
	"id" text PRIMARY KEY NOT NULL,
	"quest_id" text NOT NULL,
	"next_quest_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"quest_id" text NOT NULL,
	"text" text NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_prerequisites" (
	"quest_id" text NOT NULL,
	"prerequisite_quest_id" text NOT NULL,
	CONSTRAINT "quest_prerequisites_quest_id_prerequisite_quest_id_pk" PRIMARY KEY("quest_id","prerequisite_quest_id")
);
--> statement-breakpoint
CREATE TABLE "quest_reward_items" (
	"quest_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "quest_reward_items_quest_id_item_id_pk" PRIMARY KEY("quest_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trader" text,
	"description" text,
	"xp" integer DEFAULT 0,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "trader_items_for_sale" (
	"trader_id" text NOT NULL,
	"item_id" text NOT NULL,
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
CREATE TABLE "page_views" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "arc_loot_items" ADD CONSTRAINT "arc_loot_items_arc_id_arcs_id_fk" FOREIGN KEY ("arc_id") REFERENCES "public"."arcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hideout_station_level_requirements" ADD CONSTRAINT "hideout_station_level_requirements_hideout_station_id_hideout_stations_id_fk" FOREIGN KEY ("hideout_station_id") REFERENCES "public"."hideout_stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hideout_station_levels" ADD CONSTRAINT "hideout_station_levels_hideout_station_id_hideout_stations_id_fk" FOREIGN KEY ("hideout_station_id") REFERENCES "public"."hideout_stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recipes" ADD CONSTRAINT "item_recipes_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recycles" ADD CONSTRAINT "item_recycles_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_salvages" ADD CONSTRAINT "item_salvages_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_next_quests" ADD CONSTRAINT "quest_next_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_objectives" ADD CONSTRAINT "quest_objectives_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_prerequisites" ADD CONSTRAINT "quest_prerequisites_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_reward_items" ADD CONSTRAINT "quest_reward_items_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trader_items_for_sale" ADD CONSTRAINT "trader_items_for_sale_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."traders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trader_items_for_sale" ADD CONSTRAINT "trader_items_for_sale_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arc_loot_items_item_id_idx" ON "arc_loot_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "arc_loot_items_arc_id_idx" ON "arc_loot_items" USING btree ("arc_id");--> statement-breakpoint
CREATE INDEX "hideout_station_level_requirements_hideout_station_id_idx" ON "hideout_station_level_requirements" USING btree ("hideout_station_id");--> statement-breakpoint
CREATE INDEX "hideout_station_level_requirements_level_idx" ON "hideout_station_level_requirements" USING btree ("level");--> statement-breakpoint
CREATE INDEX "hideout_station_level_requirements_item_id_idx" ON "hideout_station_level_requirements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "hideout_station_levels_hideout_station_id_idx" ON "hideout_station_levels" USING btree ("hideout_station_id");--> statement-breakpoint
CREATE INDEX "hideout_station_levels_level_idx" ON "hideout_station_levels" USING btree ("level");--> statement-breakpoint
CREATE INDEX "item_recipes_item_id_idx" ON "item_recipes" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_recipes_material_id_idx" ON "item_recipes" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "item_recipes_craft_bench_idx" ON "item_recipes" USING btree ("craft_bench");--> statement-breakpoint
CREATE INDEX "item_recycles_item_id_idx" ON "item_recycles" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_recycles_material_id_idx" ON "item_recycles" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "item_salvages_item_id_idx" ON "item_salvages" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_salvages_material_id_idx" ON "item_salvages" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "quest_prerequisites_quest_id_idx" ON "quest_prerequisites" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "quest_prerequisites_prerequisite_quest_id_idx" ON "quest_prerequisites" USING btree ("prerequisite_quest_id");--> statement-breakpoint
CREATE INDEX "quest_reward_items_quest_id_idx" ON "quest_reward_items" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "quest_reward_items_item_id_idx" ON "quest_reward_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "trader_items_for_sale_trader_id_idx" ON "trader_items_for_sale" USING btree ("trader_id");--> statement-breakpoint
CREATE INDEX "trader_items_for_sale_item_id_idx" ON "trader_items_for_sale" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_resource_type_resource_id" ON "page_views" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_view_count" ON "page_views" USING btree ("view_count");