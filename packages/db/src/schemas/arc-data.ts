import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  real,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

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
  craftBench: jsonb("craft_bench").$type<string[]>().default([]),
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

export const maps = pgTable("maps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  wikiUrl: text("wiki_url").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  maximumTimeMinutes: integer("maximum_time_minutes").notNull(),
});

export const mapRequirements = pgTable(
  "map_requirements",
  {
    id: text("id"),
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    value: text("value").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.mapId, t.name] }),
  })
);

export const mapDifficulties = pgTable(
  "map_difficulties",
  {
    id: text("id"),
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rating: real("rating").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.mapId, t.name] }),
  })
);

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

// Quests table
export const quests = pgTable("quests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trader: text("trader"),
  description: text("description"),
  xp: integer("xp").default(0),
  updatedAt: text("updated_at"),
});

// Quest objectives
export const questObjectives = pgTable("quest_objectives", {
  id: text("id").primaryKey(), // composite: questId-index
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull(),
});

// Quest reward items
export const questRewardItems = pgTable("quest_reward_items", {
  id: text("id").primaryKey(), // composite: questId-itemId
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  quantity: integer("quantity").notNull(),
});

// Quest prerequisites (previous quests required)
export const questPrerequisites = pgTable("quest_prerequisites", {
  id: text("id").primaryKey(), // composite: questId-prerequisiteQuestId
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  prerequisiteQuestId: text("prerequisite_quest_id").notNull(),
});

// Quest next quests (unlocked after completion)
export const questNextQuests = pgTable("quest_next_quests", {
  id: text("id").primaryKey(), // composite: questId-nextQuestId
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  nextQuestId: text("next_quest_id").notNull(),
});

// Quest Relations
export const questsRelations = relations(quests, ({ many }) => ({
  objectives: many(questObjectives),
  rewardItems: many(questRewardItems),
  prerequisites: many(questPrerequisites),
  nextQuests: many(questNextQuests),
}));

export const questObjectivesRelations = relations(
  questObjectives,
  ({ one }) => ({
    quest: one(quests, {
      fields: [questObjectives.questId],
      references: [quests.id],
    }),
  })
);

export const questRewardItemsRelations = relations(
  questRewardItems,
  ({ one }) => ({
    quest: one(quests, {
      fields: [questRewardItems.questId],
      references: [quests.id],
    }),
  })
);

export const questPrerequisitesRelations = relations(
  questPrerequisites,
  ({ one }) => ({
    quest: one(quests, {
      fields: [questPrerequisites.questId],
      references: [quests.id],
    }),
  })
);

export const questNextQuestsRelations = relations(
  questNextQuests,
  ({ one }) => ({
    quest: one(quests, {
      fields: [questNextQuests.questId],
      references: [quests.id],
    }),
  })
);
