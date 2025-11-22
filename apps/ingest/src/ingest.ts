import AdmZip from "adm-zip";
import { MeiliSearch } from "meilisearch";
import { itemSchema, hideoutSchema, questSchema } from "@topside-db/schemas";
import { db, Tables, sql } from "@topside-db/db";

export async function ingestData() {
  console.log("Ingesting ARC data");

  const zipResponse = await fetch(
    "https://github.com/RaidTheory/arcraiders-data/archive/refs/heads/main.zip",
    {
      method: "GET",
      headers: {
        Accept: "application/zip",
      },
    }
  );

  const zipBuffer = await zipResponse.arrayBuffer();

  const zip = new AdmZip(Buffer.from(zipBuffer));

  const entries = zip.getEntries();

  const itemEntries = entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/items/") &&
      entry.name.endsWith(".json")
  );

  console.log(`Found ${itemEntries.length} items to process`);

  // Collect all data to batch insert
  const itemsToInsert: (typeof Tables.items.$inferInsert)[] = [];
  const effectsToInsert: (typeof Tables.itemEffects.$inferInsert)[] = [];
  const recipesToInsert: (typeof Tables.itemRecipes.$inferInsert)[] = [];
  const recyclesToInsert: (typeof Tables.itemRecycles.$inferInsert)[] = [];
  const salvagesToInsert: (typeof Tables.itemSalvages.$inferInsert)[] = [];

  for (const itemEntry of itemEntries) {
    const itemData = JSON.parse(itemEntry.getData().toString());
    const itemParseResult = itemSchema.safeParse(itemData);

    if (!itemParseResult.success) {
      console.error(
        `Invalid item data: ${itemEntry.entryName} - ${itemParseResult.error}`
      );
      continue;
    }

    const item = itemParseResult.data;

    // Collect main item record
    itemsToInsert.push({
      id: item.id,
      name: item.name.en, // Use English name as default
      description: item.description.en, // Use English description as default
      type: item.type,
      value: item.value,
      rarity: item.rarity,
      weightKg: item.weightKg,
      stackSize: item.stackSize,
      imageFilename: item.imageFilename,
      craftBench: Array.isArray(item.craftBench)
        ? item.craftBench.filter((x): x is string => typeof x === "string")
        : item.craftBench === null
        ? null
        : typeof item.craftBench === "string"
        ? [item.craftBench]
        : [],
      updatedAt: item.updatedAt,
    });

    // Collect effects
    if (item.effects) {
      for (const [effectKey, effectData] of Object.entries(item.effects)) {
        const effectId = `${item.id}-${effectKey}`;
        effectsToInsert.push({
          id: effectId,
          itemId: item.id,
          name: effectData?.en ?? effectKey, // Use English name
          value: effectData?.value ?? null,
        });
      }
    }

    // Collect recipes
    if (item.recipe) {
      for (const [materialId, quantity] of Object.entries(item.recipe)) {
        const recipeId = `${item.id}-${materialId}`;
        recipesToInsert.push({
          id: recipeId,
          itemId: item.id,
          materialId,
          quantity,
        });
      }
    }

    // Collect recycles
    if (item.recyclesInto) {
      for (const [materialId, quantity] of Object.entries(item.recyclesInto)) {
        const recycleId = `${item.id}-${materialId}`;
        recyclesToInsert.push({
          id: recycleId,
          itemId: item.id,
          materialId,
          quantity,
        });
      }
    }

    // Collect salvages
    if (item.salvagesInto) {
      for (const [materialId, quantity] of Object.entries(item.salvagesInto)) {
        const salvageId = `${item.id}-${materialId}`;
        salvagesToInsert.push({
          id: salvageId,
          itemId: item.id,
          materialId,
          quantity,
        });
      }
    }
  }

  // Helper function to chunk arrays
  const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const BATCH_SIZE = 50;

  // Batch insert items in chunks of 100
  console.info(
    `Inserting ${itemsToInsert.length} items in batches of ${BATCH_SIZE}`
  );
  const itemChunks = chunkArray(itemsToInsert, BATCH_SIZE);
  for (let i = 0; i < itemChunks.length; i++) {
    const chunk = itemChunks[i]!;
    console.info(
      `Inserting items batch ${i + 1}/${itemChunks.length} (${
        chunk.length
      } items)`
    );
    await db
      .insert(Tables.items)
      .values(chunk)
      .onConflictDoUpdate({
        target: Tables.items.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          type: sql`excluded.type`,
          value: sql`excluded.value`,
          rarity: sql`excluded.rarity`,
          weightKg: sql`excluded.weight_kg`,
          stackSize: sql`excluded.stack_size`,
          imageFilename: sql`excluded.image_filename`,
          craftBench: sql`excluded.craft_bench`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  // Batch insert effects in chunks of 100
  console.info(
    `Inserting ${effectsToInsert.length} effects in batches of ${BATCH_SIZE}`
  );
  const effectChunks = chunkArray(effectsToInsert, BATCH_SIZE);
  for (let i = 0; i < effectChunks.length; i++) {
    const chunk = effectChunks[i]!;
    console.info(
      `Inserting effects batch ${i + 1}/${effectChunks.length} (${
        chunk.length
      } effects)`
    );
    await db
      .insert(Tables.itemEffects)
      .values(chunk)
      .onConflictDoUpdate({
        target: Tables.itemEffects.id,
        set: {
          name: sql`excluded.name`,
          value: sql`excluded.value`,
        },
      });
  }

  // Batch insert recipes in chunks of 100
  console.info(
    `Inserting ${recipesToInsert.length} recipes in batches of ${BATCH_SIZE}`
  );
  const recipeChunks = chunkArray(recipesToInsert, BATCH_SIZE);
  for (let i = 0; i < recipeChunks.length; i++) {
    const chunk = recipeChunks[i]!;
    console.info(
      `Inserting recipes batch ${i + 1}/${recipeChunks.length} (${
        chunk.length
      } recipes)`
    );
    await db
      .insert(Tables.itemRecipes)
      .values(chunk)
      .onConflictDoUpdate({
        target: Tables.itemRecipes.id,
        set: {
          quantity: sql`excluded.quantity`,
        },
      });
  }

  // Batch insert recycles in chunks of 100
  console.info(
    `Inserting ${recyclesToInsert.length} recycles in batches of ${BATCH_SIZE}`
  );
  const recycleChunks = chunkArray(recyclesToInsert, BATCH_SIZE);
  for (let i = 0; i < recycleChunks.length; i++) {
    const chunk = recycleChunks[i]!;
    console.info(
      `Inserting recycles batch ${i + 1}/${recycleChunks.length} (${
        chunk.length
      } recycles)`
    );
    await db
      .insert(Tables.itemRecycles)
      .values(chunk)
      .onConflictDoUpdate({
        target: Tables.itemRecycles.id,
        set: {
          quantity: sql`excluded.quantity`,
        },
      });
  }

  // Batch insert salvages in chunks of 100
  console.info(
    `Inserting ${salvagesToInsert.length} salvages in batches of ${BATCH_SIZE}`
  );
  const salvageChunks = chunkArray(salvagesToInsert, BATCH_SIZE);
  for (let i = 0; i < salvageChunks.length; i++) {
    const chunk = salvageChunks[i]!;
    console.info(
      `Inserting salvages batch ${i + 1}/${salvageChunks.length} (${
        chunk.length
      } salvages)`
    );
    await db
      .insert(Tables.itemSalvages)
      .values(chunk)
      .onConflictDoUpdate({
        target: Tables.itemSalvages.id,
        set: {
          quantity: sql`excluded.quantity`,
        },
      });
  }

  // Process hideout entries
  const hideoutEntries = entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/hideout/") &&
      entry.name.endsWith(".json")
  );

  console.log(`Found ${hideoutEntries.length} hideouts to process`);

  // Collect hideout data to batch insert
  const hideoutsToInsert: (typeof Tables.hideouts.$inferInsert)[] = [];
  const hideoutLevelsToInsert: (typeof Tables.hideoutLevels.$inferInsert)[] =
    [];
  const hideoutRequirementsToInsert: (typeof Tables.hideoutLevelRequirements.$inferInsert)[] =
    [];

  for (const hideoutEntry of hideoutEntries) {
    const hideoutData = JSON.parse(hideoutEntry.getData().toString());
    const hideoutParseResult = hideoutSchema.safeParse(hideoutData);

    if (!hideoutParseResult.success) {
      console.error(
        `Invalid hideout data: ${hideoutEntry.entryName} - ${hideoutParseResult.error}`
      );
      continue;
    }

    const hideout = hideoutParseResult.data;

    // Collect main hideout record
    hideoutsToInsert.push({
      id: hideout.id,
      name: hideout.name.en, // Use English name
      maxLevel: hideout.maxLevel,
    });

    // Collect hideout levels and requirements
    for (const level of hideout.levels) {
      const levelId = `${hideout.id}-${level.level}`;
      hideoutLevelsToInsert.push({
        id: levelId,
        hideoutId: hideout.id,
        level: level.level,
      });

      // Collect requirements for this level
      for (const requirement of level.requirementItemIds) {
        const requirementId = `${hideout.id}-${level.level}-${requirement.itemId}`;
        hideoutRequirementsToInsert.push({
          id: requirementId,
          hideoutId: hideout.id,
          level: level.level,
          itemId: requirement.itemId,
          quantity: requirement.quantity,
        });
      }
    }
  }

  // Batch insert hideouts
  if (hideoutsToInsert.length > 0) {
    console.info(
      `Inserting ${hideoutsToInsert.length} hideouts in batches of ${BATCH_SIZE}`
    );
    const hideoutChunks = chunkArray(hideoutsToInsert, BATCH_SIZE);
    for (let i = 0; i < hideoutChunks.length; i++) {
      const chunk = hideoutChunks[i]!;
      console.info(
        `Inserting hideouts batch ${i + 1}/${hideoutChunks.length} (${
          chunk.length
        } hideouts)`
      );
      await db
        .insert(Tables.hideouts)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.hideouts.id,
          set: {
            name: sql`excluded.name`,
            maxLevel: sql`excluded.max_level`,
          },
        });
    }
  }

  // Batch insert hideout levels
  if (hideoutLevelsToInsert.length > 0) {
    console.info(
      `Inserting ${hideoutLevelsToInsert.length} hideout levels in batches of ${BATCH_SIZE}`
    );
    const levelChunks = chunkArray(hideoutLevelsToInsert, BATCH_SIZE);
    for (let i = 0; i < levelChunks.length; i++) {
      const chunk = levelChunks[i]!;
      console.info(
        `Inserting hideout levels batch ${i + 1}/${levelChunks.length} (${
          chunk.length
        } levels)`
      );
      await db
        .insert(Tables.hideoutLevels)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.hideoutLevels.id,
          set: {
            level: sql`excluded.level`,
          },
        });
    }
  }

  // Batch insert hideout level requirements
  if (hideoutRequirementsToInsert.length > 0) {
    console.info(
      `Inserting ${hideoutRequirementsToInsert.length} hideout requirements in batches of ${BATCH_SIZE}`
    );
    const requirementChunks = chunkArray(
      hideoutRequirementsToInsert,
      BATCH_SIZE
    );
    for (let i = 0; i < requirementChunks.length; i++) {
      const chunk = requirementChunks[i]!;
      console.info(
        `Inserting hideout requirements batch ${i + 1}/${
          requirementChunks.length
        } (${chunk.length} requirements)`
      );
      await db
        .insert(Tables.hideoutLevelRequirements)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.hideoutLevelRequirements.id,
          set: {
            itemId: sql`excluded.item_id`,
            quantity: sql`excluded.quantity`,
          },
        });
    }
  }

  // Process quest entries
  const questEntries = entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/quests/") &&
      entry.name.endsWith(".json")
  );

  console.log(`Found ${questEntries.length} quests to process`);

  // Collect quest data to batch insert
  const questsToInsert: (typeof Tables.quests.$inferInsert)[] = [];
  const questObjectivesToInsert: (typeof Tables.questObjectives.$inferInsert)[] =
    [];
  const questRewardItemsToInsert: (typeof Tables.questRewardItems.$inferInsert)[] =
    [];
  const questPrerequisitesToInsert: (typeof Tables.questPrerequisites.$inferInsert)[] =
    [];
  const questNextQuestsToInsert: (typeof Tables.questNextQuests.$inferInsert)[] =
    [];

  for (const questEntry of questEntries) {
    const questData = JSON.parse(questEntry.getData().toString());
    const questParseResult = questSchema.safeParse(questData);

    if (!questParseResult.success) {
      console.error(
        `Invalid quest data: ${questEntry.entryName} - ${questParseResult.error}`
      );
      continue;
    }

    const quest = questParseResult.data;

    // Collect main quest record
    questsToInsert.push({
      id: quest.id,
      name: quest.name.en, // Use English name
      trader: quest.trader,
      description: quest.description?.en, // Use English description if available
      xp: quest.xp,
      updatedAt: quest.updatedAt,
    });

    // Collect objectives
    for (let i = 0; i < quest.objectives.length; i++) {
      const objectiveId = `${quest.id}-${i}`;
      questObjectivesToInsert.push({
        id: objectiveId,
        questId: quest.id,
        text: quest.objectives[i]!.en, // Use English text
        orderIndex: i,
      });
    }

    // Collect reward items
    for (const reward of quest.rewardItemIds) {
      const rewardId = `${quest.id}-${reward.itemId}`;
      questRewardItemsToInsert.push({
        id: rewardId,
        questId: quest.id,
        itemId: reward.itemId,
        quantity: reward.quantity,
      });
    }

    // Collect prerequisites
    for (const prerequisiteId of quest.previousQuestIds) {
      const id = `${quest.id}-${prerequisiteId}`;
      questPrerequisitesToInsert.push({
        id,
        questId: quest.id,
        prerequisiteQuestId: prerequisiteId,
      });
    }

    // Collect next quests
    for (const nextQuestId of quest.nextQuestIds) {
      const id = `${quest.id}-${nextQuestId}`;
      questNextQuestsToInsert.push({
        id,
        questId: quest.id,
        nextQuestId: nextQuestId,
      });
    }
  }

  // Batch insert quests
  if (questsToInsert.length > 0) {
    console.info(
      `Inserting ${questsToInsert.length} quests in batches of ${BATCH_SIZE}`
    );
    const questChunks = chunkArray(questsToInsert, BATCH_SIZE);
    for (let i = 0; i < questChunks.length; i++) {
      const chunk = questChunks[i]!;
      console.info(
        `Inserting quests batch ${i + 1}/${questChunks.length} (${
          chunk.length
        } quests)`
      );
      await db
        .insert(Tables.quests)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.quests.id,
          set: {
            name: sql`excluded.name`,
            trader: sql`excluded.trader`,
            description: sql`excluded.description`,
            xp: sql`excluded.xp`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }
  }

  // Batch insert quest objectives
  if (questObjectivesToInsert.length > 0) {
    console.info(
      `Inserting ${questObjectivesToInsert.length} quest objectives in batches of ${BATCH_SIZE}`
    );
    const objectiveChunks = chunkArray(questObjectivesToInsert, BATCH_SIZE);
    for (let i = 0; i < objectiveChunks.length; i++) {
      const chunk = objectiveChunks[i]!;
      console.info(
        `Inserting quest objectives batch ${i + 1}/${objectiveChunks.length} (${
          chunk.length
        } objectives)`
      );
      await db
        .insert(Tables.questObjectives)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.questObjectives.id,
          set: {
            text: sql`excluded.text`,
            orderIndex: sql`excluded.order_index`,
          },
        });
    }
  }

  // Batch insert quest reward items
  if (questRewardItemsToInsert.length > 0) {
    console.info(
      `Inserting ${questRewardItemsToInsert.length} quest reward items in batches of ${BATCH_SIZE}`
    );
    const rewardChunks = chunkArray(questRewardItemsToInsert, BATCH_SIZE);
    for (let i = 0; i < rewardChunks.length; i++) {
      const chunk = rewardChunks[i]!;
      console.info(
        `Inserting quest reward items batch ${i + 1}/${rewardChunks.length} (${
          chunk.length
        } rewards)`
      );
      await db
        .insert(Tables.questRewardItems)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.questRewardItems.id,
          set: {
            itemId: sql`excluded.item_id`,
            quantity: sql`excluded.quantity`,
          },
        });
    }
  }

  // Batch insert quest prerequisites
  if (questPrerequisitesToInsert.length > 0) {
    console.info(
      `Inserting ${questPrerequisitesToInsert.length} quest prerequisites in batches of ${BATCH_SIZE}`
    );
    const prerequisiteChunks = chunkArray(
      questPrerequisitesToInsert,
      BATCH_SIZE
    );
    for (let i = 0; i < prerequisiteChunks.length; i++) {
      const chunk = prerequisiteChunks[i]!;
      console.info(
        `Inserting quest prerequisites batch ${i + 1}/${
          prerequisiteChunks.length
        } (${chunk.length} prerequisites)`
      );
      await db
        .insert(Tables.questPrerequisites)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.questPrerequisites.id,
          set: {
            prerequisiteQuestId: sql`excluded.prerequisite_quest_id`,
          },
        });
    }
  }

  // Batch insert quest next quests
  if (questNextQuestsToInsert.length > 0) {
    console.info(
      `Inserting ${questNextQuestsToInsert.length} quest next quests in batches of ${BATCH_SIZE}`
    );
    const nextQuestChunks = chunkArray(questNextQuestsToInsert, BATCH_SIZE);
    for (let i = 0; i < nextQuestChunks.length; i++) {
      const chunk = nextQuestChunks[i]!;
      console.info(
        `Inserting quest next quests batch ${i + 1}/${
          nextQuestChunks.length
        } (${chunk.length} next quests)`
      );
      await db
        .insert(Tables.questNextQuests)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.questNextQuests.id,
          set: {
            nextQuestId: sql`excluded.next_quest_id`,
          },
        });
    }
  }

  console.info("ARC data ingestion complete");

  // Sync to Meilisearch
  const meilisearch = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
    apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
  });

  const index = meilisearch.index("items");

  console.info("Syncing items to Meilisearch");

  await index.updateSettings({
    searchableAttributes: ["name", "description"],
    filterableAttributes: ["type", "rarity"],
    sortableAttributes: ["value", "weightKg"],
  });

  const task = await index.addDocuments(itemsToInsert, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for items", { task });

  // Sync quests to Meilisearch
  const questIndex = meilisearch.index("quests");
  console.info("Syncing quests to Meilisearch");

  await questIndex.updateSettings({
    searchableAttributes: ["name", "description", "trader"],
    filterableAttributes: ["trader"],
    sortableAttributes: ["xp"],
  });

  const questTask = await questIndex.addDocuments(questsToInsert, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for quests", { task: questTask });

  // Sync hideouts to Meilisearch
  const hideoutIndex = meilisearch.index("hideouts");
  console.info("Syncing hideouts to Meilisearch");

  await hideoutIndex.updateSettings({
    searchableAttributes: ["name"],
    sortableAttributes: ["maxLevel"],
  });

  const hideoutTask = await hideoutIndex.addDocuments(hideoutsToInsert, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for hideouts", {
    task: hideoutTask,
  });
}
