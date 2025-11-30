import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  real,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { pageViews } from "./analytics";

// Main items table
export const items = pgTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type"),
  value: real("value"),
  rarity: text("rarity"),
  weightKg: real("weight_kg"),
  stackSize: integer("stack_size").default(1),
  imageFilename: text("image_filename"),
  craftBench: jsonb("craft_bench").$type<string[]>().default([]),
  updatedAt: text("updated_at"),
  effects: jsonb("effects")
    .$type<{ name: string; value: string }[]>()
    .default([]),
});

// Item recipes (crafting ingredients)
export const itemRecipes = pgTable(
  "item_recipes",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull(), // e.g., "chemicals", "plastic_parts"
    craftBench: text("craft_bench").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.materialId] }),
    index("item_recipes_item_id_idx").on(t.itemId),
    index("item_recipes_material_id_idx").on(t.materialId),
    index("item_recipes_craft_bench_idx").on(t.craftBench),
  ]
);

// Item recycles (what you get from recycling)
export const itemRecycles = pgTable(
  "item_recycles",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.materialId] }),
    index("item_recycles_item_id_idx").on(t.itemId),
    index("item_recycles_material_id_idx").on(t.materialId),
  ]
);

// Item salvages (what you get from salvaging)
export const itemSalvages = pgTable(
  "item_salvages",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.materialId] }),
    index("item_salvages_item_id_idx").on(t.itemId),
    index("item_salvages_material_id_idx").on(t.materialId),
  ]
);

// Hideouts table
export const hideoutStations = pgTable("hideout_stations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  maxLevel: integer("max_level").notNull(),
});

// Hideout levels
export const hideoutStationLevels = pgTable(
  "hideout_station_levels",
  {
    hideoutStationId: text("hideout_station_id")
      .notNull()
      .references(() => hideoutStations.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.hideoutStationId, t.level] }),
    index("hideout_station_levels_hideout_station_id_idx").on(
      t.hideoutStationId
    ),
    index("hideout_station_levels_level_idx").on(t.level),
  ]
);

// Hideout level requirements (items needed to upgrade)
export const hideoutStationLevelRequirements = pgTable(
  "hideout_station_level_requirements",
  {
    hideoutStationId: text("hideout_station_id")
      .notNull()
      .references(() => hideoutStations.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.hideoutStationId, t.level, t.itemId] }),
    index("hideout_station_level_requirements_hideout_station_id_idx").on(
      t.hideoutStationId
    ),
    index("hideout_station_level_requirements_level_idx").on(t.level),
    index("hideout_station_level_requirements_item_id_idx").on(t.itemId),
  ]
);

export const maps = pgTable("maps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  wikiUrl: text("wiki_url").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  maximumTimeMinutes: integer("maximum_time_minutes").notNull(),
  requirements: jsonb("requirements")
    .$type<{ name: string; value: string }[]>()
    .default([]),
  difficulties: jsonb("difficulties")
    .$type<{ name: string; rating: number }[]>()
    .default([]),
});

// Relations
export const itemsRelations = relations(items, ({ many, one }) => ({
  recipes: many(itemRecipes, { relationName: "recipeItem" }),
  recycles: many(itemRecycles, { relationName: "recycleItem" }),
  salvages: many(itemSalvages, { relationName: "salvageItem" }),
  recipeMaterials: many(itemRecipes, { relationName: "recipeMaterial" }),
  recycleMaterials: many(itemRecycles, { relationName: "recycleMaterial" }),
  salvageMaterials: many(itemSalvages, { relationName: "salvageMaterial" }),
  hideoutRequirements: many(hideoutStationLevelRequirements),
  pageViews: one(pageViews, {
    fields: [items.id],
    references: [pageViews.resourceId],
  }),
  traders: many(traderItemsForSale),
  questsRewards: many(questRewardItems),
  arcLootItems: many(arcLootItems),
}));

export const itemRecipesRelations = relations(itemRecipes, ({ one }) => ({
  item: one(items, {
    fields: [itemRecipes.itemId],
    references: [items.id],
    relationName: "recipeItem",
  }),
  material: one(items, {
    fields: [itemRecipes.materialId],
    references: [items.id],
    relationName: "recipeMaterial",
  }),
}));

export const itemRecyclesRelations = relations(itemRecycles, ({ one }) => ({
  item: one(items, {
    fields: [itemRecycles.itemId],
    references: [items.id],
    relationName: "recycleItem",
  }),
  material: one(items, {
    fields: [itemRecycles.materialId],
    references: [items.id],
    relationName: "recycleMaterial",
  }),
}));

export const itemSalvagesRelations = relations(itemSalvages, ({ one }) => ({
  item: one(items, {
    fields: [itemSalvages.itemId],
    references: [items.id],
    relationName: "salvageItem",
  }),
  material: one(items, {
    fields: [itemSalvages.materialId],
    references: [items.id],
    relationName: "salvageMaterial",
  }),
}));

export const hideoutStationsRelations = relations(
  hideoutStations,
  ({ many, one }) => ({
    levels: many(hideoutStationLevels),
    requirements: many(hideoutStationLevelRequirements),
    pageViews: one(pageViews, {
      fields: [hideoutStations.id],
      references: [pageViews.resourceId],
    }),
  })
);

export const hideoutStationLevelsRelations = relations(
  hideoutStationLevels,
  ({ one, many }) => ({
    hideoutStation: one(hideoutStations, {
      fields: [hideoutStationLevels.hideoutStationId],
      references: [hideoutStations.id],
    }),
    requirements: many(hideoutStationLevelRequirements),
  })
);

export const hideoutStationLevelRequirementsRelations = relations(
  hideoutStationLevelRequirements,
  ({ one }) => ({
    hideoutStation: one(hideoutStations, {
      fields: [hideoutStationLevelRequirements.hideoutStationId],
      references: [hideoutStations.id],
    }),
    level: one(hideoutStationLevels, {
      fields: [
        hideoutStationLevelRequirements.hideoutStationId,
        hideoutStationLevelRequirements.level,
      ],
      references: [
        hideoutStationLevels.hideoutStationId,
        hideoutStationLevels.level,
      ],
    }),
    item: one(items, {
      fields: [hideoutStationLevelRequirements.itemId],
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
export const questRewardItems = pgTable(
  "quest_reward_items",
  {
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.questId, t.itemId] }),
    index("quest_reward_items_quest_id_idx").on(t.questId),
    index("quest_reward_items_item_id_idx").on(t.itemId),
  ]
);

// Quest prerequisites (previous quests required)
export const questPrerequisites = pgTable(
  "quest_prerequisites",
  {
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    prerequisiteQuestId: text("prerequisite_quest_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.questId, t.prerequisiteQuestId] }),
    index("quest_prerequisites_quest_id_idx").on(t.questId),
    index("quest_prerequisites_prerequisite_quest_id_idx").on(
      t.prerequisiteQuestId
    ),
  ]
);

// Quest next quests (unlocked after completion)
export const questNextQuests = pgTable("quest_next_quests", {
  id: text("id").primaryKey(), // composite: questId-nextQuestId
  questId: text("quest_id")
    .notNull()
    .references(() => quests.id, { onDelete: "cascade" }),
  nextQuestId: text("next_quest_id").notNull(),
});

// Quest Relations
export const questsRelations = relations(quests, ({ many, one }) => ({
  objectives: many(questObjectives),
  rewardItems: many(questRewardItems),
  prerequisites: many(questPrerequisites),
  nextQuests: many(questNextQuests),
  pageViews: one(pageViews, {
    fields: [quests.id],
    references: [pageViews.resourceId],
  }),
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
    item: one(items, {
      fields: [questRewardItems.itemId],
      references: [items.id],
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

export const arcs = pgTable("arcs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  wikiUrl: text("wiki_url").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  health: integer("health"),
  armorPlating: text("armor_plating"),
  threatLevel: text("threat_level"),
  attacks: jsonb("attacks")
    .$type<{ type: string; description: string }[]>()
    .default([])
    .notNull(),
  weaknesses: jsonb("weaknesses")
    .$type<
      { name: string; description: string; type: "armor" | "intelligence" }[]
    >()
    .default([])
    .notNull(),
  destroyXp: integer("destroy_xp"),
  lootXp: jsonb("loot_xp")
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
});

export const arcLootItems = pgTable(
  "arc_loot_items",
  {
    arcId: text("arc_id")
      .notNull()
      .references(() => arcs.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.arcId, t.itemId] }),
    index("arc_loot_items_item_id_idx").on(t.itemId),
    index("arc_loot_items_arc_id_idx").on(t.arcId),
  ]
);

export const arcLootItemsRelations = relations(arcLootItems, ({ one }) => ({
  arc: one(arcs, {
    fields: [arcLootItems.arcId],
    references: [arcs.id],
  }),
  item: one(items, {
    fields: [arcLootItems.itemId],
    references: [items.id],
  }),
}));

export const arcsRelations = relations(arcs, ({ one, many }) => ({
  pageViews: one(pageViews, {
    fields: [arcs.id],
    references: [pageViews.resourceId],
  }),
  arcLootItems: many(arcLootItems),
}));

export const traders = pgTable("traders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  wikiUrl: text("wiki_url").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  sellCategories: jsonb("sell_categories")
    .$type<string[]>()
    .default([])
    .notNull(),
});

export const tradersRelations = relations(traders, ({ many }) => ({
  itemsForSale: many(traderItemsForSale),
}));

export const traderItemsForSale = pgTable(
  "trader_items_for_sale",
  {
    traderId: text("trader_id")
      .notNull()
      .references(() => traders.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    currency: text("currency", {
      enum: ["credits", "seeds", "augment"],
    }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.traderId, t.itemId] }),
    index("trader_items_for_sale_trader_id_idx").on(t.traderId),
    index("trader_items_for_sale_item_id_idx").on(t.itemId),
  ]
);

export const traderItemsForSaleRelations = relations(
  traderItemsForSale,
  ({ one }) => ({
    trader: one(traders, {
      fields: [traderItemsForSale.traderId],
      references: [traders.id],
    }),
    item: one(items, {
      fields: [traderItemsForSale.itemId],
      references: [items.id],
    }),
  })
);
