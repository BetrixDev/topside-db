import { Config, Context, Data, Effect, Layer, Ref } from "effect";
import { Tables } from "@topside-db/db";
import { FetchHttpClient, HttpClient, HttpClientError } from "@effect/platform";
import {
  OpenRouterClient,
  OpenRouterLanguageModel,
} from "@effect/ai-openrouter";
import AdmZip from "adm-zip";
import {
  hideoutStationSchema,
  itemSchema,
  questSchema,
  type LocalizedString,
} from "@topside-db/schemas";
import { prettifyError } from "zod";
import { LanguageModel } from "@effect/ai";
import { isEmpty } from "@topside-db/utils";

const TranslationModel = OpenRouterLanguageModel.model("");

type Item = typeof Tables.items.$inferInsert;
type ItemRecipe = typeof Tables.itemRecipes.$inferInsert;
type ItemRecycle = typeof Tables.itemRecycles.$inferInsert;
type ItemSalvage = typeof Tables.itemSalvages.$inferInsert;
type Quest = typeof Tables.quests.$inferInsert;
type QuestObjective = typeof Tables.questObjectives.$inferInsert;
type QuestRewardItem = typeof Tables.questRewardItems.$inferInsert;
type QuestPrerequisite = typeof Tables.questPrerequisites.$inferInsert;
type QuestNextQuest = typeof Tables.questNextQuests.$inferInsert;
type HideoutStation = typeof Tables.hideoutStations.$inferInsert;
type HideoutStationLevel = typeof Tables.hideoutStationLevels.$inferInsert;
type HideoutStationLevelRequirement =
  typeof Tables.hideoutStationLevelRequirements.$inferInsert;

type RepoParseFail = {
  entryName: string;
  errorMessage: string;
};

class IngestionDataContext extends Context.Tag("IngestionDataContext")<
  IngestionDataContext,
  {
    repoParseFails: Ref.Ref<RepoParseFail[]>;
    data: {
      items: Ref.Ref<Item[]>;
      itemRecipes: Ref.Ref<ItemRecipe[]>;
      itemRecycles: Ref.Ref<ItemRecycle[]>;
      itemSalvages: Ref.Ref<ItemSalvage[]>;
      quests: Ref.Ref<Quest[]>;
      questObjectives: Ref.Ref<QuestObjective[]>;
      questRewardItems: Ref.Ref<QuestRewardItem[]>;
      questPrerequisites: Ref.Ref<QuestPrerequisite[]>;
      questNextQuests: Ref.Ref<QuestNextQuest[]>;
      hideoutStations: Ref.Ref<HideoutStation[]>;
      hideoutStationLevels: Ref.Ref<HideoutStationLevel[]>;
      hideoutStationLevelRequirements: Ref.Ref<
        HideoutStationLevelRequirement[]
      >;
    };
  }
>() {}

const IngestionDataContextLive = Layer.effect(
  IngestionDataContext,
  Effect.gen(function* () {
    return {
      repoParseFails: yield* Ref.make<RepoParseFail[]>([]),
      data: {
        items: yield* Ref.make<Item[]>([]),
        itemRecipes: yield* Ref.make<ItemRecipe[]>([]),
        itemRecycles: yield* Ref.make<ItemRecycle[]>([]),
        itemSalvages: yield* Ref.make<ItemSalvage[]>([]),
        quests: yield* Ref.make<Quest[]>([]),
        questObjectives: yield* Ref.make<QuestObjective[]>([]),
        questRewardItems: yield* Ref.make<QuestRewardItem[]>([]),
        questPrerequisites: yield* Ref.make<QuestPrerequisite[]>([]),
        questNextQuests: yield* Ref.make<QuestNextQuest[]>([]),
        hideoutStations: yield* Ref.make<HideoutStation[]>([]),
        hideoutStationLevels: yield* Ref.make<HideoutStationLevel[]>([]),
        hideoutStationLevelRequirements: yield* Ref.make<
          HideoutStationLevelRequirement[]
        >([]),
      },
    };
  })
);

class JsonParseError extends Data.TaggedClass("JsonParseError")<{
  entryName: string;
}> {}

class AdmZipError extends Data.TaggedClass("AdmZipError")<{}> {}

const getArcRaidersRepoZip = Effect.gen(function* () {
  yield* Effect.log("Getting ARC Raiders repo zip");

  const client = yield* HttpClient.HttpClient;

  const response = yield* client.get(
    "https://github.com/RaidTheory/arcraiders-data/archive/refs/heads/main.zip",
    {
      accept: "application/zip",
    }
  );

  const zipBuffer = yield* response.arrayBuffer;

  const zip = yield* Effect.try({
    try: () => new AdmZip(Buffer.from(zipBuffer)),
    catch: () => new AdmZipError(),
  });

  yield* Effect.log("Got ARC Raiders repo zip");

  return zip;
});

function getItemEntries(zip: AdmZip) {
  const entries = zip.getEntries();

  return entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/items/") &&
      entry.name.endsWith(".json")
  );
}

function getQuestEntries(zip: AdmZip) {
  const entries = zip.getEntries();

  return entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/quests/") &&
      entry.name.endsWith(".json")
  );
}

function getHideoutStationEntries(zip: AdmZip) {
  const entries = zip.getEntries();

  return entries.filter(
    (entry) =>
      entry.entryName.includes("arcraiders-data-main/hideout/") &&
      entry.name.endsWith(".json")
  );
}

const makeIngestItemTask = (entry: AdmZip.IZipEntry) =>
  Effect.gen(function* () {
    const context = yield* IngestionDataContext;

    const itemData = yield* Effect.try({
      try: () => JSON.parse(entry.getData().toString()),
      catch: () => new JsonParseError({ entryName: entry.entryName }),
    });

    const itemParseResult = itemSchema.safeParse(itemData);

    if (!itemParseResult.success) {
      yield* Effect.log(
        `Invalid item data: ${entry.entryName} - ${itemParseResult.error}`
      );

      yield* Ref.update(context.repoParseFails, (fails) => [
        ...fails,
        {
          entryName: entry.entryName,
          errorMessage: prettifyError(itemParseResult.error),
        },
      ]);

      return;
    }

    const item = itemParseResult.data;

    const [itemName, itemDescription] = yield* Effect.all(
      [
        getEnglishLocalization(item.name),
        getEnglishLocalization(item.description),
      ],
      {
        concurrency: 2,
      }
    );

    if (!itemName || !itemDescription) {
      return yield* Effect.fail(
        `No name or description translations available for item: ${item.id}`
      );
    }

    yield* Ref.update(context.data.items, (items) => [
      ...items,
      {
        id: item.id,
        name: itemName ?? "N/A",
        description: itemDescription ?? "N/A",
        type: item.type,
        value: item.value,
        rarity: item.rarity,
      },
    ]);

    if (item.recipe) {
      for (const [materialId, quantity] of Object.entries(item.recipe)) {
        const craftBench = Array.isArray(item.craftBench)
          ? item.craftBench[0] ?? ""
          : item.craftBench ?? "";

        if (craftBench.trim() === "") {
          continue;
        }

        yield* Ref.update(context.data.itemRecipes, (recipes) => [
          ...recipes,
          {
            itemId: item.id,
            materialId: materialId,
            quantity: quantity,
            craftBench: craftBench.trim(),
          },
        ]);
      }
    }

    if (item.recyclesInto) {
      for (const [materialId, quantity] of Object.entries(item.recyclesInto)) {
        yield* Ref.update(context.data.itemRecycles, (recycles) => [
          ...recycles,
          {
            itemId: item.id,
            materialId: materialId,
            quantity: quantity,
          },
        ]);
      }
    }

    if (item.salvagesInto) {
      for (const [materialId, quantity] of Object.entries(item.salvagesInto)) {
        yield* Ref.update(context.data.itemSalvages, (salvages) => [
          ...salvages,
          {
            itemId: item.id,
            materialId: materialId,
            quantity: quantity,
          },
        ]);
      }
    }

    return item;
  });

const getEnglishLocalization = (localization: LocalizedString) =>
  Effect.gen(function* () {
    if (localization.en) {
      return localization.en;
    }

    if (isEmpty(localization)) {
      return null;
    }

    yield* Effect.log(
      `Translating localization to English: ${JSON.stringify(localization)}`
    );

    const response = yield* Effect.orElse(
      Effect.retry(
        LanguageModel.generateText({
          prompt: `Translate the following localization to English: ${JSON.stringify(
            localization
          )}`,
        }),
        {
          times: 2,
        }
      ),
      () => Effect.succeed(null)
    );

    return response?.text ?? null;
  }).pipe(Effect.provide(TranslationModel));

const makeIngestQuestTask = (entry: AdmZip.IZipEntry) =>
  Effect.gen(function* () {
    const context = yield* IngestionDataContext;

    const questData = yield* Effect.try({
      try: () => JSON.parse(entry.getData().toString()),
      catch: () => new JsonParseError({ entryName: entry.entryName }),
    });

    const questParseResult = questSchema.safeParse(questData);

    if (!questParseResult.success) {
      yield* Effect.log(
        `Invalid quest data: ${entry.entryName} - ${questParseResult.error}`
      );

      yield* Ref.update(context.repoParseFails, (fails) => [
        ...fails,
        {
          entryName: entry.entryName,
          errorMessage: prettifyError(questParseResult.error),
        },
      ]);

      return;
    }

    const quest = questParseResult.data;

    const questName = yield* getEnglishLocalization(quest.name);

    if (!questName) {
      yield* Ref.update(context.repoParseFails, (fails) => [
        ...fails,
        {
          entryName: entry.entryName,
          errorMessage: `No name translations available for quest: ${quest.id}`,
        },
      ]);

      return yield* Effect.fail(
        `No name translations available for quest: ${quest.id}`
      );
    }

    yield* Ref.update(context.data.quests, (quests) => [
      ...quests,
      {
        id: quest.id,
        name: questName,
        description: quest.description?.en,
        xp: quest.xp,
        updatedAt: quest.updatedAt,
      },
    ]);

    for (const [index, objective] of quest.objectives.entries()) {
      const objectiveText = yield* getEnglishLocalization(objective);

      yield* Ref.update(context.data.questObjectives, (objectives) => [
        ...objectives,
        {
          id: `${quest.id}-${index}`,
          questId: quest.id,
          text: objectiveText ?? "N/A",
          orderIndex: index,
        },
      ]);
    }

    for (const reward of quest.rewardItemIds) {
      yield* Ref.update(context.data.questRewardItems, (rewardItems) => [
        ...rewardItems,
        {
          id: `${quest.id}-${reward.itemId}`,
          questId: quest.id,
          itemId: reward.itemId,
          quantity: reward.quantity,
        },
      ]);
    }

    for (const prerequisite of quest.previousQuestIds) {
      yield* Ref.update(context.data.questPrerequisites, (prerequisites) => [
        ...prerequisites,
        {
          id: `${quest.id}-${prerequisite}`,
          questId: quest.id,
          prerequisiteQuestId: prerequisite,
        },
      ]);
    }

    for (const nextQuest of quest.nextQuestIds) {
      yield* Ref.update(context.data.questNextQuests, (nextQuests) => [
        ...nextQuests,
        {
          id: `${quest.id}-${nextQuest}`,
          questId: quest.id,
          nextQuestId: nextQuest,
        },
      ]);
    }

    return quest;
  });

const makeIngestHideoutStationTask = (entry: AdmZip.IZipEntry) =>
  Effect.gen(function* () {
    const context = yield* IngestionDataContext;

    const hideoutStationData = yield* Effect.try({
      try: () => JSON.parse(entry.getData().toString()),
      catch: () => new JsonParseError({ entryName: entry.entryName }),
    });

    const hideoutStationParseResult =
      hideoutStationSchema.safeParse(hideoutStationData);

    if (!hideoutStationParseResult.success) {
      yield* Ref.update(context.repoParseFails, (fails) => [
        ...fails,
        {
          entryName: entry.entryName,
          errorMessage: prettifyError(hideoutStationParseResult.error),
        },
      ]);

      return yield* Effect.log(
        `Invalid hideout station data: ${entry.entryName} - ${hideoutStationParseResult.error}`
      );
    }

    const hideoutStation = hideoutStationParseResult.data;

    const hideoutStationName = yield* getEnglishLocalization(
      hideoutStation.name
    );

    if (!hideoutStationName) {
      yield* Ref.update(context.repoParseFails, (fails) => [
        ...fails,
        {
          entryName: entry.entryName,
          errorMessage: `No name translations available for hideout station: ${hideoutStation.id}`,
        },
      ]);

      return yield* Effect.fail(
        `No name translations available for hideout station: ${hideoutStation.id}`
      );
    }

    yield* Ref.update(context.data.hideoutStations, (hideoutStations) => [
      ...hideoutStations,
      {
        id: hideoutStation.id,
        name: hideoutStationName,
        maxLevel: hideoutStation.maxLevel,
      },
    ]);

    for (const level of hideoutStation.levels) {
      yield* Ref.update(context.data.hideoutStationLevels, (levels) => [
        ...levels,
        {
          hideoutStationId: hideoutStation.id,
          level: level.level,
        },
      ]);

      for (const requirement of level.requirementItemIds) {
        yield* Ref.update(
          context.data.hideoutStationLevelRequirements,
          (requirements) => [
            ...requirements,
            {
              hideoutStationId: hideoutStation.id,
              level: level.level,
              itemId: requirement.itemId,
              quantity: requirement.quantity,
            },
          ]
        );
      }
    }
  });

const program = Effect.gen(function* () {
  yield* Effect.log("Starting ingestion program");

  const zip = yield* Effect.retry(getArcRaidersRepoZip, {
    times: 2,
    while: (error) => HttpClientError.isHttpClientError(error),
  });

  const itemEntries = getItemEntries(zip);

  yield* Effect.all(itemEntries.map(makeIngestItemTask), { concurrency: 10 });

  const questEntries = getQuestEntries(zip);

  yield* Effect.all(questEntries.map(makeIngestQuestTask), { concurrency: 10 });

  const hideoutStationEntries = getHideoutStationEntries(zip);

  yield* Effect.all(hideoutStationEntries.map(makeIngestHideoutStationTask), {
    concurrency: 10,
  });

  const context = yield* IngestionDataContext;

  const items = yield* Ref.get(context.data.items);
  const itemRecipes = yield* Ref.get(context.data.itemRecipes);
  const itemRecycles = yield* Ref.get(context.data.itemRecycles);
  const itemSalvages = yield* Ref.get(context.data.itemSalvages);
  const parseFails = yield* Ref.get(context.repoParseFails);
  const quests = yield* Ref.get(context.data.quests);
  const questObjectives = yield* Ref.get(context.data.questObjectives);
  const questRewardItems = yield* Ref.get(context.data.questRewardItems);
  const questPrerequisites = yield* Ref.get(context.data.questPrerequisites);
  const questNextQuests = yield* Ref.get(context.data.questNextQuests);
  const hideoutStations = yield* Ref.get(context.data.hideoutStations);
  const hideoutStationLevels = yield* Ref.get(
    context.data.hideoutStationLevels
  );
  const hideoutStationLevelRequirements = yield* Ref.get(
    context.data.hideoutStationLevelRequirements
  );

  yield* Effect.log(`Ingestion complete:`);
  yield* Effect.log(`  Items: ${items.length}`);
  yield* Effect.log(`  Item Recipes: ${itemRecipes.length}`);
  yield* Effect.log(`  Item Recycles: ${itemRecycles.length}`);
  yield* Effect.log(`  Item Salvages: ${itemSalvages.length}`);
  yield* Effect.log(`  Quests: ${quests.length}`);
  yield* Effect.log(`  Quest Objectives: ${questObjectives.length}`);
  yield* Effect.log(`  Quest Reward Items: ${questRewardItems.length}`);
  yield* Effect.log(`  Quest Prerequisites: ${questPrerequisites.length}`);
  yield* Effect.log(`  Quest Next Quests: ${questNextQuests.length}`);
  yield* Effect.log(`  Hideout Stations: ${hideoutStations.length}`);
  yield* Effect.log(`  Hideout Station Levels: ${hideoutStationLevels.length}`);
  yield* Effect.log(
    `  Hideout Station Level Requirements: ${hideoutStationLevelRequirements.length}`
  );
  yield* Effect.log(`  Parse Failures: ${parseFails.length}`);
});

const HttpLive = FetchHttpClient.layer;

const OpenRouterLive = OpenRouterClient.layerConfig({
  apiKey: Config.redacted("OPENROUTER_API_KEY"),
}).pipe(Layer.provide(HttpLive));

const MainLive = Layer.mergeAll(
  IngestionDataContextLive,
  OpenRouterLive,
  HttpLive
);

Effect.runPromise(program.pipe(Effect.provide(MainLive)));
