import AdmZip from "adm-zip";
import { MeiliSearch } from "meilisearch";
import { itemSchema } from "@topside-db/schemas";
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
      craftBench: item.craftBench,
      updatedAt: item.updatedAt,
    });

    // Collect effects
    if (item.effects) {
      for (const [effectKey, effectData] of Object.entries(item.effects)) {
        const effectId = `${item.id}-${effectKey}`;
        effectsToInsert.push({
          id: effectId,
          itemId: item.id,
          name: effectData.en, // Use English name
          value: effectData.value,
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

  console.info("Meilisearch sync task created", { task });
}
