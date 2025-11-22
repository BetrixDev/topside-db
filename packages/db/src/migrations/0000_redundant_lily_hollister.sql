CREATE TABLE "hideout_level_requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"hideout_id" text NOT NULL,
	"level" integer NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hideout_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"hideout_id" text NOT NULL,
	"level" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hideouts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_level" integer NOT NULL
);
--> statement-breakpoint
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
	"craft_bench" jsonb DEFAULT '[]'::jsonb,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "map_difficulties" (
	"id" text,
	"map_id" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "map_difficulties_map_id_name_pk" PRIMARY KEY("map_id","name")
);
--> statement-breakpoint
CREATE TABLE "map_requirements" (
	"id" text,
	"map_id" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "map_requirements_map_id_name_pk" PRIMARY KEY("map_id","name")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wiki_url" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text,
	"maximum_time_minutes" integer NOT NULL
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
	"id" text PRIMARY KEY NOT NULL,
	"quest_id" text NOT NULL,
	"prerequisite_quest_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_reward_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quest_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL
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
ALTER TABLE "hideout_level_requirements" ADD CONSTRAINT "hideout_level_requirements_hideout_id_hideouts_id_fk" FOREIGN KEY ("hideout_id") REFERENCES "public"."hideouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hideout_levels" ADD CONSTRAINT "hideout_levels_hideout_id_hideouts_id_fk" FOREIGN KEY ("hideout_id") REFERENCES "public"."hideouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_effects" ADD CONSTRAINT "item_effects_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recipes" ADD CONSTRAINT "item_recipes_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_recycles" ADD CONSTRAINT "item_recycles_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_salvages" ADD CONSTRAINT "item_salvages_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_difficulties" ADD CONSTRAINT "map_difficulties_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_requirements" ADD CONSTRAINT "map_requirements_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_next_quests" ADD CONSTRAINT "quest_next_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_objectives" ADD CONSTRAINT "quest_objectives_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_prerequisites" ADD CONSTRAINT "quest_prerequisites_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_reward_items" ADD CONSTRAINT "quest_reward_items_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;