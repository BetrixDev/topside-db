import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const pageViews = pgTable(
  "page_views",
  {
    id: text("id").primaryKey(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    viewCount: integer("view_count").notNull().default(0),
    uniqueViews: integer("unique_views").notNull().default(0),
    lastUpdated: timestamp("last_updated", { mode: "date" }).defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_unique_resource_type_resource_id").on(
      table.resourceType,
      table.resourceId
    ),
    index("idx_view_count").on(table.viewCount),
  ]
);
