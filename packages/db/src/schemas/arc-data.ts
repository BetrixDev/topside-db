import { relations } from "drizzle-orm";
import { pgTable, text, integer, real } from "drizzle-orm/pg-core";

// Main items table
export const items = pgTable("items", {
  id: text("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  type: text("type"),
  value: real("value"),
  rarity: text("rarity"),
  weightKg: real("weight_kg"),
  stackSize: integer("stack_size").default(1),
  imageFilename: text("image_filename"),
  craftBench: text("craft_bench"),
  updatedAt: text("updated_at"),
});

// Item effects
export const itemEffects = pgTable("item_effects", {
  id: text("id").primaryKey(), // composite: itemId-effectName
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Stamina Regeneration", "Duration", etc.
  value: text("value"), // "5/s", "10s", etc.
});

// Item recipes (crafting ingredients)
export const itemRecipes = pgTable("item_recipes", {
  id: text("id").primaryKey(), // composite: itemId-materialId
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull(), // e.g., "chemicals", "plastic_parts"
  quantity: integer("quantity").notNull(),
});

// Item recycles (what you get from recycling)
export const itemRecycles = pgTable("item_recycles", {
  id: text("id").primaryKey(), // composite: itemId-materialId
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull(),
  quantity: integer("quantity").notNull(),
});

// Item salvages (what you get from salvaging)
export const itemSalvages = pgTable("item_salvages", {
  id: text("id").primaryKey(), // composite: itemId-materialId
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull(),
  quantity: integer("quantity").notNull(),
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  effects: many(itemEffects),
  recipes: many(itemRecipes),
  recycles: many(itemRecycles),
  salvages: many(itemSalvages),
}));

export const itemEffectsRelations = relations(itemEffects, ({ one }) => ({
  item: one(items, {
    fields: [itemEffects.itemId],
    references: [items.id],
  }),
}));

export const itemRecipesRelations = relations(itemRecipes, ({ one }) => ({
  item: one(items, {
    fields: [itemRecipes.itemId],
    references: [items.id],
  }),
}));

export const itemRecyclesRelations = relations(itemRecycles, ({ one }) => ({
  item: one(items, {
    fields: [itemRecycles.itemId],
    references: [items.id],
  }),
}));

export const itemSalvagesRelations = relations(itemSalvages, ({ one }) => ({
  item: one(items, {
    fields: [itemSalvages.itemId],
    references: [items.id],
  }),
}));
