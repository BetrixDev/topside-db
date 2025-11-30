import { Context, Data, Effect, Layer } from "effect";
import { db, sql, Tables } from "@topside-db/db";

export class DatabaseError extends Data.TaggedClass("DatabaseError")<{
  cause: unknown;
  operation: string;
}> {}

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  {
    items: {
      sync: (
        items: (typeof Tables.items.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    itemRecipes: {
      sync: (
        recipes: (typeof Tables.itemRecipes.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    itemRecycles: {
      sync: (
        recycles: (typeof Tables.itemRecycles.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    itemSalvages: {
      sync: (
        salvages: (typeof Tables.itemSalvages.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    hideoutStations: {
      sync: (
        stations: (typeof Tables.hideoutStations.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    hideoutStationLevels: {
      sync: (
        levels: (typeof Tables.hideoutStationLevels.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    hideoutStationLevelRequirements: {
      sync: (
        requirements: (typeof Tables.hideoutStationLevelRequirements.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    maps: {
      sync: (
        maps: (typeof Tables.maps.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    quests: {
      sync: (
        quests: (typeof Tables.quests.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    questObjectives: {
      sync: (
        objectives: (typeof Tables.questObjectives.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    questRewardItems: {
      sync: (
        rewards: (typeof Tables.questRewardItems.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    questPrerequisites: {
      sync: (
        prerequisites: (typeof Tables.questPrerequisites.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    questNextQuests: {
      sync: (
        nextQuests: (typeof Tables.questNextQuests.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    arcs: {
      sync: (
        arcs: (typeof Tables.arcs.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    arcLootItems: {
      sync: (
        lootItems: (typeof Tables.arcLootItems.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    traders: {
      sync: (
        traders: (typeof Tables.traders.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };

    traderItemsForSale: {
      sync: (
        itemsForSale: (typeof Tables.traderItemsForSale.$inferInsert)[]
      ) => Effect.Effect<void, DatabaseError>;
    };
  }
>() {}

export const DatabaseServiceLive = Layer.succeed(DatabaseService, {
  // ============ ITEMS ============
  items: {
    sync: (items: (typeof Tables.items.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.items);
            if (items.length > 0) {
              await tx.insert(Tables.items).values(items).onConflictDoNothing();
            }
          }),
        catch: (cause) => new DatabaseError({ cause, operation: "items.sync" }),
      }),
  },

  itemRecipes: {
    sync: (recipes: (typeof Tables.itemRecipes.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.itemRecipes);
            if (recipes.length > 0) {
              await tx
                .insert(Tables.itemRecipes)
                .values(recipes)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "itemRecipes.sync" }),
      }),
  },

  itemRecycles: {
    sync: (recycles: (typeof Tables.itemRecycles.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.itemRecycles);
            if (recycles.length > 0) {
              await tx
                .insert(Tables.itemRecycles)
                .values(recycles)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "itemRecycles.sync" }),
      }),
  },

  itemSalvages: {
    sync: (salvages: (typeof Tables.itemSalvages.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.itemSalvages);
            if (salvages.length > 0) {
              await tx
                .insert(Tables.itemSalvages)
                .values(salvages)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "itemSalvages.sync" }),
      }),
  },

  hideoutStations: {
    sync: (stations: (typeof Tables.hideoutStations.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.hideoutStations);
            if (stations.length > 0) {
              await tx
                .insert(Tables.hideoutStations)
                .values(stations)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "hideoutStations.sync" }),
      }),
  },

  hideoutStationLevels: {
    sync: (levels: (typeof Tables.hideoutStationLevels.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.hideoutStationLevels);
            if (levels.length > 0) {
              await tx
                .insert(Tables.hideoutStationLevels)
                .values(levels)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "hideoutStationLevels.sync" }),
      }),
  },

  hideoutStationLevelRequirements: {
    sync: (
      requirements: (typeof Tables.hideoutStationLevelRequirements.$inferInsert)[]
    ) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.hideoutStationLevelRequirements);
            if (requirements.length > 0) {
              await tx
                .insert(Tables.hideoutStationLevelRequirements)
                .values(requirements)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({
            cause,
            operation: "hideoutStationLevelRequirements.sync",
          }),
      }),
  },

  maps: {
    sync: (maps: (typeof Tables.maps.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.maps);
            if (maps.length > 0) {
              await tx.insert(Tables.maps).values(maps).onConflictDoNothing();
            }
          }),
        catch: (cause) => new DatabaseError({ cause, operation: "maps.sync" }),
      }),
  },

  quests: {
    sync: (quests: (typeof Tables.quests.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.quests);
            if (quests.length > 0) {
              await tx
                .insert(Tables.quests)
                .values(quests)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "quests.sync" }),
      }),
  },

  questObjectives: {
    sync: (objectives: (typeof Tables.questObjectives.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.questObjectives);
            if (objectives.length > 0) {
              await tx
                .insert(Tables.questObjectives)
                .values(objectives)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "questObjectives.sync" }),
      }),
  },

  questRewardItems: {
    sync: (rewards: (typeof Tables.questRewardItems.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.questRewardItems);
            if (rewards.length > 0) {
              await tx
                .insert(Tables.questRewardItems)
                .values(rewards)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "questRewardItems.sync" }),
      }),
  },

  questPrerequisites: {
    sync: (prerequisites: (typeof Tables.questPrerequisites.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.questPrerequisites);
            if (prerequisites.length > 0) {
              await tx
                .insert(Tables.questPrerequisites)
                .values(prerequisites)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "questPrerequisites.sync" }),
      }),
  },

  questNextQuests: {
    sync: (nextQuests: (typeof Tables.questNextQuests.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.questNextQuests);
            if (nextQuests.length > 0) {
              await tx
                .insert(Tables.questNextQuests)
                .values(nextQuests)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "questNextQuests.sync" }),
      }),
  },

  // ============ ARCS ============
  arcs: {
    sync: (arcs: (typeof Tables.arcs.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.arcs);
            if (arcs.length > 0) {
              await tx.insert(Tables.arcs).values(arcs).onConflictDoNothing();
            }
          }),
        catch: (cause) => new DatabaseError({ cause, operation: "arcs.sync" }),
      }),
  },

  // ============ ARC LOOT ITEMS ============
  arcLootItems: {
    sync: (lootItems: (typeof Tables.arcLootItems.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.arcLootItems);
            if (lootItems.length > 0) {
              await tx
                .insert(Tables.arcLootItems)
                .values(lootItems)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "arcLootItems.sync" }),
      }),
  },

  // ============ TRADERS ============
  traders: {
    sync: (traders: (typeof Tables.traders.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.traders);
            if (traders.length > 0) {
              await tx
                .insert(Tables.traders)
                .values(traders)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "traders.sync" }),
      }),
  },

  // ============ TRADER ITEMS FOR SALE ============
  traderItemsForSale: {
    sync: (itemsForSale: (typeof Tables.traderItemsForSale.$inferInsert)[]) =>
      Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            await tx.delete(Tables.traderItemsForSale);
            if (itemsForSale.length > 0) {
              await tx
                .insert(Tables.traderItemsForSale)
                .values(itemsForSale)
                .onConflictDoNothing();
            }
          }),
        catch: (cause) =>
          new DatabaseError({ cause, operation: "traderItemsForSale.sync" }),
      }),
  },
});
