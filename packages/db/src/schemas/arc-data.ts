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

// Hideouts table
export const hideouts = pgTable("hideouts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  maxLevel: integer("max_level").notNull(),
});

// Hideout levels
export const hideoutLevels = pgTable("hideout_levels", {
  id: text("id").primaryKey(), // composite: hideoutId-level
  hideoutId: text("hideout_id")
    .notNull()
    .references(() => hideouts.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
});

// Hideout level requirements (items needed to upgrade)
export const hideoutLevelRequirements = pgTable("hideout_level_requirements", {
  id: text("id").primaryKey(), // composite: hideoutId-level-itemId
  hideoutId: text("hideout_id")
    .notNull()
    .references(() => hideouts.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  itemId: text("item_id").notNull(),
  quantity: integer("quantity").notNull(),
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  effects: many(itemEffects),
  recipes: many(itemRecipes),
  recycles: many(itemRecycles),
  salvages: many(itemSalvages),
  hideoutRequirements: many(hideoutLevelRequirements),
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

export const hideoutsRelations = relations(hideouts, ({ many }) => ({
  levels: many(hideoutLevels),
  requirements: many(hideoutLevelRequirements),
}));

export const hideoutLevelsRelations = relations(
  hideoutLevels,
  ({ one, many }) => ({
    hideout: one(hideouts, {
      fields: [hideoutLevels.hideoutId],
      references: [hideouts.id],
    }),
    requirements: many(hideoutLevelRequirements),
  })
);

export const hideoutLevelRequirementsRelations = relations(
  hideoutLevelRequirements,
  ({ one }) => ({
    hideout: one(hideouts, {
      fields: [hideoutLevelRequirements.hideoutId],
      references: [hideouts.id],
    }),
    level: one(hideoutLevels, {
      fields: [
        hideoutLevelRequirements.hideoutId,
        hideoutLevelRequirements.level,
      ],
      references: [hideoutLevels.hideoutId, hideoutLevels.level],
    }),
    item: one(items, {
      fields: [hideoutLevelRequirements.itemId],
      references: [items.id],
    }),
  })
);
