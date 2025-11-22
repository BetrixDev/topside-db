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
ALTER TABLE "hideout_level_requirements" ADD CONSTRAINT "hideout_level_requirements_hideout_id_hideouts_id_fk" FOREIGN KEY ("hideout_id") REFERENCES "public"."hideouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hideout_levels" ADD CONSTRAINT "hideout_levels_hideout_id_hideouts_id_fk" FOREIGN KEY ("hideout_id") REFERENCES "public"."hideouts"("id") ON DELETE cascade ON UPDATE no action;