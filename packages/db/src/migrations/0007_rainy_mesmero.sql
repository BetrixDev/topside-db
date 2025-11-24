DROP TABLE "item_effects" CASCADE;--> statement-breakpoint
DROP TABLE "map_difficulties" CASCADE;--> statement-breakpoint
DROP TABLE "map_requirements" CASCADE;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "effects" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "requirements" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "difficulties" jsonb DEFAULT '[]'::jsonb;