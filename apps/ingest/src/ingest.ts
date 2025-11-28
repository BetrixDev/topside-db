import AdmZip from "adm-zip";
import { MeiliSearch } from "meilisearch";
import { itemSchema, hideoutSchema, questSchema } from "@topside-db/schemas";
import { db, Tables, sql } from "@topside-db/db";
import {
  BASE_WIKI_URL,
  scrapeArcPage,
  scrapeArcsPage,
  scrapeMapPage,
  scrapeMapsPage,
  scrapeTraderPage,
  scrapeTradersPage,
} from "./wiki";
import { snakeCase } from "es-toolkit/string";

// Helper function to calculate Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

// Helper function to normalize Roman numerals (I-X) to numbers (1-10)
function normalizeRomanNumerals(text: string): string {
  const romanToNumber: Record<string, string> = {
    " I": " 1",
    " II": " 2",
    " III": " 3",
    " IV": " 4",
    " V": " 5",
    " VI": " 6",
    " VII": " 7",
    " VIII": " 8",
    " IX": " 9",
    " X": " 10",
  };

  const numberToRoman: Record<string, string> = {
    " 1": " I",
    " 2": " II",
    " 3": " III",
    " 4": " IV",
    " 5": " V",
    " 6": " VI",
    " 7": " VII",
    " 8": " VIII",
    " 9": " IX",
    " 10": " X",
  };

  let normalized = text;

  // Convert Roman numerals to numbers
  for (const [roman, number] of Object.entries(romanToNumber)) {
    normalized = normalized.replace(new RegExp(roman + "\\b", "gi"), number);
  }

  // Also try converting numbers to Roman numerals for comparison
  for (const [number, roman] of Object.entries(numberToRoman)) {
    normalized = normalized.replace(new RegExp(number + "\\b", "g"), roman);
  }

  return normalized;
}

// Helper function to find closest matching item name using Levenshtein distance
function findClosestItemMatch(
  targetName: string,
  itemMap: Map<string, string>
): { id: string; name: string; distance: number } | null {
  let closestMatch: { id: string; name: string; distance: number } | null =
    null;

  const normalizedTarget = normalizeRomanNumerals(
    targetName.toLowerCase().trim()
  );

  for (const [itemName, itemId] of itemMap.entries()) {
    const normalizedItemName = normalizeRomanNumerals(itemName);

    // First try exact match on normalized names
    if (normalizedItemName === normalizedTarget) {
      return { id: itemId, name: itemName, distance: 0 };
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(normalizedTarget, normalizedItemName);

    if (closestMatch === null || distance < closestMatch.distance) {
      closestMatch = { id: itemId, name: itemName, distance };
    }
  }

  return closestMatch;
}

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

    const craftBench = Array.isArray(item.craftBench)
      ? item.craftBench.filter((x): x is string => typeof x === "string")
      : item.craftBench === null
      ? null
      : typeof item.craftBench === "string"
      ? [item.craftBench]
      : [];

    const effects =
      item.effects !== undefined
        ? Object.entries(item.effects).map(([effectKey, effectData]) => ({
            name: effectData?.en ?? effectKey,
            value: effectData?.value ?? "",
          }))
        : [];

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
      craftBench,
      effects,
      updatedAt: item.updatedAt,
    });

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

  console.log("Scraping wiki pages");

  const maps = await scrapeMapsPage();

  for (const map of maps.maps) {
    const mapData = await scrapeMapPage(map.wikiUrl);

    const difficulties = (mapData.diffculties ?? []).map((difficulty) => ({
      name: difficulty.id,
      rating: difficulty.rating,
    }));

    const requirements = (map.requirements ?? []).map((requirement) => ({
      name: requirement.name,
      value: requirement.value,
    }));

    await db
      .insert(Tables.maps)
      .values({
        id: snakeCase(map.name),
        name: map.name,
        wikiUrl: `${BASE_WIKI_URL}${map.wikiUrl}`,
        imageUrl: `${BASE_WIKI_URL}${map.imageUrl}`,
        description: map.description,
        maximumTimeMinutes: map.maximumTimeMinutes,
        difficulties,
        requirements,
      })
      .onConflictDoUpdate({
        target: Tables.maps.id,
        set: {
          name: sql`excluded.name`,
          wikiUrl: sql`excluded.wiki_url`,
          imageUrl: sql`excluded.image_url`,
          description: sql`excluded.description`,
          maximumTimeMinutes: sql`excluded.maximum_time_minutes`,
          difficulties: sql`excluded.difficulties`,
          requirements: sql`excluded.requirements`,
        },
      });
  }

  const arcs = await scrapeArcsPage();

  console.log(`Found ${arcs.arcVariants.length} arcs to process`);

  // Collect arc data to batch insert
  const arcsToInsert: (typeof Tables.arcs.$inferInsert)[] = [];
  const arcLootItemsToInsert: (typeof Tables.arcLootItems.$inferInsert)[] = [];

  await Promise.all(
    arcs.arcVariants.map(async (arc) => {
      const arcData = await scrapeArcPage(arc.wikiUrlPath);

      const arcId = snakeCase(arc.name);

      // Collect main arc record with all data in JSON columns
      arcsToInsert.push({
        id: arcId,
        name: arc.name,
        wikiUrl: `${BASE_WIKI_URL}${arc.wikiUrlPath}`,
        imageUrl: `${BASE_WIKI_URL}${arc.imageUrl}`,
        description: arcData.generalSummary,
        health:
          typeof arcData.health === "string" && arcData.health.trim() !== ""
            ? (() => {
                const numStr = arcData.health
                  .replace(/,/g, "")
                  .replace(/[^0-9.]/g, "");
                const num = Number(numStr);

                const PG_INT_MAX = 2147483647;
                return !isNaN(num) && num <= PG_INT_MAX ? num : null;
              })()
            : null,
        armorPlating: arcData.armorPlating ?? null,
        threatLevel: arcData.threatLevel ?? null,
        loot: arcData.loot,
        attacks: arcData.attacks,
        weaknesses: arcData.weaknesses,
      });

      for (const loot of arcData.loot) {
        const closestItem = findClosestItemMatch(loot, itemNameToId);

        if (closestItem?.distance && closestItem.distance <= 3) {
          arcLootItemsToInsert.push({
            arcId: arcId,
            itemId: closestItem.id,
          });
        }
      }
    })
  );

  // Batch insert arcs
  if (arcsToInsert.length > 0) {
    console.info(
      `Inserting ${arcsToInsert.length} arcs in batches of ${BATCH_SIZE}`
    );
    const arcChunks = chunkArray(arcsToInsert, BATCH_SIZE);
    for (let i = 0; i < arcChunks.length; i++) {
      const chunk = arcChunks[i]!;
      console.info(
        `Inserting arcs batch ${i + 1}/${arcChunks.length} (${
          chunk.length
        } arcs)`
      );
      await db
        .insert(Tables.arcs)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.arcs.id,
          set: {
            name: sql`excluded.name`,
            wikiUrl: sql`excluded.wiki_url`,
            imageUrl: sql`excluded.image_url`,
            description: sql`excluded.description`,
            health: sql`excluded.health`,
            armorPlating: sql`excluded.armor_plating`,
            threatLevel: sql`excluded.threat_level`,
            loot: sql`excluded.loot`,
            attacks: sql`excluded.attacks`,
            weaknesses: sql`excluded.weaknesses`,
          },
        });
    }
  }

  if (arcLootItemsToInsert.length > 0) {
    console.info(
      `Inserting ${arcLootItemsToInsert.length} arc loot items in batches of ${BATCH_SIZE}`
    );
    const arcLootItemChunks = chunkArray(arcLootItemsToInsert, BATCH_SIZE);
    for (let i = 0; i < arcLootItemChunks.length; i++) {
      const chunk = arcLootItemChunks[i]!;

      console.info(
        `Inserting arc loot items batch ${i + 1}/${arcLootItemChunks.length} (${
          chunk.length
        } loot items)`
      );
      await db
        .insert(Tables.arcLootItems)
        .values(chunk)
        .onConflictDoUpdate({
          target: [Tables.arcLootItems.arcId, Tables.arcLootItems.itemId],
          set: {
            itemId: sql`excluded.item_id`,
          },
        });
    }
  }

  console.info("ARC data ingestion complete");

  // Scrape and ingest trader data
  console.log("Scraping traders page");
  const tradersData = await scrapeTradersPage();

  console.log(`Found ${tradersData.traders.length} traders to process`);

  // Collect trader data to batch insert
  const tradersToInsert: (typeof Tables.traders.$inferInsert)[] = [];
  const traderItemsForSaleToInsert: (typeof Tables.traderItemsForSale.$inferInsert)[] =
    [];

  // Get all items from DB to match names to IDs
  const allItems = await db.query.items.findMany();
  const itemNameToId = new Map(
    allItems
      .filter((item) => item.name) // Filter out items without names
      .map((item) => [item.name!.toLowerCase().trim(), item.id])
  );

  for (const trader of tradersData.traders) {
    const traderId = snakeCase(trader.name);
    console.log(`Processing trader: ${trader.name}`);

    const traderDetails = await scrapeTraderPage(trader.wikiUrl);

    tradersToInsert.push({
      id: traderId,
      name: trader.name,
      wikiUrl: `${BASE_WIKI_URL}${trader.wikiUrl}`,
      imageUrl: `${BASE_WIKI_URL}${trader.imageUrl}`,
      description: traderDetails.description,
      sellCategories: trader.sells,
    });

    for (const item of traderDetails.itemsForSale) {
      // Try exact match first
      let itemId = itemNameToId.get(item.itemName.toLowerCase().trim());

      // If no exact match, use fuzzy matching
      if (!itemId) {
        const match = findClosestItemMatch(item.itemName, itemNameToId);

        if (match && match.distance <= 3) {
          // Accept matches with distance <= 3
          itemId = match.id;
          console.log(
            `Fuzzy matched "${item.itemName}" to "${match.name}" (distance: ${match.distance})`
          );
        } else if (match) {
          console.warn(
            `Could not find good match for item: ${item.itemName} (trader: ${trader.name}). Closest was "${match.name}" with distance ${match.distance}`
          );
          continue;
        } else {
          console.warn(
            `Could not find item ID for: ${item.itemName} (trader: ${trader.name})`
          );
          continue;
        }
      }

      const quantity = item.stockAmount
        ? parseInt(item.stockAmount.split("/")[0] || "1", 10)
        : null;

      const quantityPerSale = item.quantityPerSale
        ? parseInt(item.quantityPerSale.replace(/^x/i, ""), 10)
        : 1;

      const currency =
        item.itemPriceCurrency === "nature" ? "seeds" : item.itemPriceCurrency;

      traderItemsForSaleToInsert.push({
        traderId,
        itemId,
        quantity,
        quantityPerSale,
        currency,
      });
    }
  }

  // Deduplicate trader items - keep the last occurrence of each trader-item combination
  const traderItemsMap = new Map<
    string,
    (typeof traderItemsForSaleToInsert)[0]
  >();
  for (const item of traderItemsForSaleToInsert) {
    const key = `${item.traderId}-${item.itemId}`;
    traderItemsMap.set(key, item);
  }
  const deduplicatedTraderItems = Array.from(traderItemsMap.values());

  console.info(
    `Deduplicated ${traderItemsForSaleToInsert.length} trader items to ${deduplicatedTraderItems.length} unique items`
  );

  // Batch insert traders
  if (tradersToInsert.length > 0) {
    console.info(
      `Inserting ${tradersToInsert.length} traders in batches of ${BATCH_SIZE}`
    );
    const traderChunks = chunkArray(tradersToInsert, BATCH_SIZE);
    for (let i = 0; i < traderChunks.length; i++) {
      const chunk = traderChunks[i]!;
      console.info(
        `Inserting traders batch ${i + 1}/${traderChunks.length} (${
          chunk.length
        } traders)`
      );
      await db
        .insert(Tables.traders)
        .values(chunk)
        .onConflictDoUpdate({
          target: Tables.traders.id,
          set: {
            name: sql`excluded.name`,
            wikiUrl: sql`excluded.wiki_url`,
            imageUrl: sql`excluded.image_url`,
            description: sql`excluded.description`,
            sellCategories: sql`excluded.sell_categories`,
          },
        });
    }
  }

  // Batch insert trader items for sale
  if (deduplicatedTraderItems.length > 0) {
    console.info(
      `Inserting ${deduplicatedTraderItems.length} trader items in batches of ${BATCH_SIZE}`
    );
    const traderItemChunks = chunkArray(deduplicatedTraderItems, BATCH_SIZE);
    for (let i = 0; i < traderItemChunks.length; i++) {
      const chunk = traderItemChunks[i]!;
      console.info(
        `Inserting trader items batch ${i + 1}/${traderItemChunks.length} (${
          chunk.length
        } items)`
      );
      await db
        .insert(Tables.traderItemsForSale)
        .values(chunk)
        .onConflictDoUpdate({
          target: [
            Tables.traderItemsForSale.traderId,
            Tables.traderItemsForSale.itemId,
          ],
          set: {
            quantity: sql`excluded.quantity`,
            quantityPerSale: sql`excluded.quantity_per_sale`,
            currency: sql`excluded.currency`,
          },
        });
    }
  }

  console.info("Trader data ingestion complete");

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

  // Sync maps to Meilisearch
  const mapIndex = meilisearch.index("maps");
  console.info("Syncing maps to Meilisearch");

  await mapIndex.updateSettings({
    searchableAttributes: ["name", "description"],
    filterableAttributes: ["maximumTimeMinutes"],
    sortableAttributes: ["maximumTimeMinutes"],
  });

  const mapDocuments = await db.query.maps.findMany();

  const mapTask = await mapIndex.addDocuments(mapDocuments, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for maps", { task: mapTask });

  // Sync arcs to Meilisearch
  const arcIndex = meilisearch.index("arcs");
  console.info("Syncing arcs to Meilisearch");

  await arcIndex.updateSettings({
    searchableAttributes: ["name", "description", "threatLevel"],
    filterableAttributes: ["threatLevel"],
    sortableAttributes: ["health"],
  });

  const arcTask = await arcIndex.addDocuments(arcsToInsert, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for arcs", { task: arcTask });

  // Sync traders to Meilisearch
  const traderIndex = meilisearch.index("traders");
  console.info("Syncing traders to Meilisearch");

  await traderIndex.updateSettings({
    searchableAttributes: ["name", "description"],
    filterableAttributes: ["sellCategories"],
  });

  const traderTask = await traderIndex.addDocuments(tradersToInsert, {
    primaryKey: "id",
  });

  console.info("Meilisearch sync task created for traders", {
    task: traderTask,
  });
}
