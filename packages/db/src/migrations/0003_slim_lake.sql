CREATE TABLE "arcs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wiki_url" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text NOT NULL,
	"health" integer,
	"armor_plating" text,
	"threat_level" text,
	"loot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attacks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weaknesses" jsonb DEFAULT '[]'::jsonb NOT NULL
);
