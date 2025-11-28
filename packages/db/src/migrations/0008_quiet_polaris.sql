CREATE TABLE "arc_loot_items" (
	"arc_id" text NOT NULL,
	"item_id" text NOT NULL,
	CONSTRAINT "arc_loot_items_arc_id_item_id_pk" PRIMARY KEY("arc_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "arc_loot_items" ADD CONSTRAINT "arc_loot_items_arc_id_arcs_id_fk" FOREIGN KEY ("arc_id") REFERENCES "public"."arcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arc_loot_items_item_id_idx" ON "arc_loot_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "arc_loot_items_arc_id_idx" ON "arc_loot_items" USING btree ("arc_id");