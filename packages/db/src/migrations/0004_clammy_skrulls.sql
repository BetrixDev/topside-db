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
ALTER TABLE "quest_next_quests" ADD CONSTRAINT "quest_next_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_objectives" ADD CONSTRAINT "quest_objectives_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_prerequisites" ADD CONSTRAINT "quest_prerequisites_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_reward_items" ADD CONSTRAINT "quest_reward_items_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;