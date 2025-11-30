import {
  Config,
  Context,
  Data,
  Effect,
  Layer,
  Option,
  Ref,
  Schema,
} from "effect";
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
import { isEmpty, onlyPrimitiveValues } from "@topside-db/utils";
import { WikiService, WikiServiceLive } from "./wiki-service";
import { snakeCase } from "es-toolkit";
import { FuzzyMatcher, makeFuzzyMatcherService } from "./fuzzy-matcher";
import { DatabaseService, DatabaseServiceLive } from "./db-service";
import {
  MeilisearchService,
  MeilisearchServiceLive,
} from "./meilisearch-service";

const TranslationModel = OpenRouterLanguageModel.model(
  "google/gemini-2.0-flash-001"
);
const WikiScrapingModel = OpenRouterLanguageModel.model(
  "google/gemini-2.5-flash"
);
const WikiScrapingModelFallback =
  OpenRouterLanguageModel.model("openai/gpt-5-mini");

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
type Arc = typeof Tables.arcs.$inferInsert;
type ArcLootItem = typeof Tables.arcLootItems.$inferInsert;
type Map = typeof Tables.maps.$inferInsert;
type Trader = typeof Tables.traders.$inferInsert;
type TraderItemForSale = typeof Tables.traderItemsForSale.$inferInsert;

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
      arcs: Ref.Ref<Arc[]>;
      arcLootItems: Ref.Ref<ArcLootItem[]>;
      maps: Ref.Ref<Map[]>;
      traders: Ref.Ref<Trader[]>;
      traderItemsForSale: Ref.Ref<TraderItemForSale[]>;
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
        arcs: yield* Ref.make<Arc[]>([]),
        arcLootItems: yield* Ref.make<ArcLootItem[]>([]),
        maps: yield* Ref.make<Map[]>([]),
        traders: yield* Ref.make<Trader[]>([]),
        traderItemsForSale: yield* Ref.make<TraderItemForSale[]>([]),
      },
    };
  })
);

const FuzzyMatcherLive = Layer.effect(
  FuzzyMatcher,
  Effect.gen(function* () {
    const ctx = yield* IngestionDataContext;
    return makeFuzzyMatcherService({
      items: ctx.data.items,
      quests: ctx.data.quests,
      hideoutStations: ctx.data.hideoutStations,
      arcs: ctx.data.arcs,
    });
  })
).pipe(Layer.provide(IngestionDataContextLive));

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

const ArcVariant = Schema.Struct({
  name: Schema.String.annotations({
    description: "The name of the arc variant",
  }),
  wikiPageUrl: Schema.String.annotations({
    description: "The URL of the arc variant wiki page",
  }),
  fullImageUrl: Schema.String.annotations({
    description: "The full URL of the arc variant image",
  }),
  drops: Schema.Array(
    Schema.String.annotations({
      description: "The items that the arc variant drops",
    })
  ),
  destroyXp: Schema.Number.annotations({
    description: "The XP reward for destroying the arc variant",
  }),
  lootXp: Schema.Record({
    key: Schema.String.annotations({
      description:
        "What is being looted (e.g. 'Core', 'Part') or 'Arc' if it's not specified",
    }),
    value: Schema.Number.annotations({
      description: "The XP reward for looting the item",
    }),
  }),
});

type ArcVariant = Schema.Schema.Type<typeof ArcVariant>;

const getArcVariantsFromArcWikiPage = Effect.gen(function* () {
  yield* Effect.log("Getting arc variants from arc wiki page");

  const wikiService = yield* WikiService;

  const arcPageWikiContent = yield* wikiService.getPageContent("/wiki/ARC");

  const response = yield* Effect.retry(
    LanguageModel.generateObject({
      prompt: `Extract the arcs from the variants section of this wiki page according to the json schema: ${arcPageWikiContent}`,
      schema: Schema.Struct({
        arcVariants: Schema.Array(ArcVariant).annotations({
          description:
            "The arcs from the variants section of the wiki page. Do not includes Arc Husks or Arc Probes",
        }),
      }),
    }).pipe(Effect.provide(WikiScrapingModel)),
    { times: 2 }
  );

  return response?.value?.arcVariants ?? [];
});

const makeScrapeArcVariantTask = (arcVariant: ArcVariant) =>
  Effect.gen(function* () {
    yield* Effect.log(`Scraping arc variant: ${arcVariant.name}`);

    const wikiService = yield* WikiService;

    const arcPageWikiContent = yield* wikiService.getPageContent(
      arcVariant.wikiPageUrl
    );

    const response = yield* Effect.retry(
      LanguageModel.generateObject({
        prompt: `Extract the arc information from this webpage: ${arcPageWikiContent}`,
        schema: Schema.Struct({
          loot: Schema.Array(Schema.String).annotations({
            description: "The items described in the Loot section",
          }),
          generalSummary: Schema.String.annotations({
            description:
              "A short markdown formatted summary of the arc variant, tips and tricks, etc. It should be no more than 100 words.",
          }),
          threatLevel: Schema.String.annotations({
            description: "The threat level of the arc variant",
          }),
          armorPlating: Schema.String.annotations({
            description: "The armor plating of the arc variant",
          }),
          attacks: Schema.Array(
            Schema.Struct({
              type: Schema.String.annotations({
                description: "The type of attack",
              }),
              description: Schema.String.annotations({
                description: "The description of the attack",
              }),
            })
          ),
          weaknesses: Schema.Array(
            Schema.Struct({
              name: Schema.String.annotations({
                description: "The name of the weakness",
              }),
              description: Schema.String.annotations({
                description:
                  "A short description of what this weakness means in relation to the arc variant",
              }),
              type: Schema.Literal("armor", "intelligence").annotations({
                description: "The type of weakness",
              }),
            })
          ).annotations({
            description: "The weaknesses of the arc variant",
          }),
          health: Schema.Number.annotations({
            description: "The health of the arc variant",
          }),
        }),
      }).pipe(Effect.provide(WikiScrapingModel)),
      { times: 2 }
    );

    const context = yield* IngestionDataContext;

    const arcId = snakeCase(arcVariant.name);

    yield* Ref.update(context.data.arcs, (arcs) => [
      ...arcs,
      {
        description: response?.value?.generalSummary ?? "",
        name: arcVariant.name,
        id: arcId,
        wikiUrl: arcVariant.wikiPageUrl,
        imageUrl: arcVariant.fullImageUrl,
        destroyXp: arcVariant.destroyXp,
        lootXp: arcVariant.lootXp,
        threatLevel: response?.value?.threatLevel,
        armorPlating: response?.value?.armorPlating,
        attacks: response?.value?.attacks as any,
        weaknesses: response?.value?.weaknesses as any,
      },
    ]);

    const fuzzyMatcher = yield* FuzzyMatcher;

    for (const loot of response?.value?.loot ?? []) {
      const closestItem = yield* fuzzyMatcher.findItem(loot, {
        maxDistance: 2,
      });

      if (Option.isNone(closestItem)) {
        yield* Effect.log(`No closest item found for loot: ${loot}`);
        continue;
      }

      yield* Ref.update(context.data.arcLootItems, (lootItems) => [
        ...lootItems,
        {
          arcId,
          itemId: closestItem.value.item.id,
        },
      ]);
    }

    yield* Effect.log(`Scraped arc variant: ${arcVariant.name}`);
  });

const scrapeArcsFromWiki = Effect.gen(function* () {
  yield* Effect.log("Scraping arcs from wiki");

  const arcVariants = yield* getArcVariantsFromArcWikiPage;

  yield* Effect.all(arcVariants.map(makeScrapeArcVariantTask), {
    concurrency: 10,
  });
});

const MapInfo = Schema.Struct({
  name: Schema.String.annotations({
    description: "The name of the map",
  }),
  wikiUrl: Schema.String.annotations({
    description: "The URL path of the map wiki page (e.g., /wiki/Scrapyard)",
  }),
  imageUrl: Schema.String.annotations({
    description: "The full URL of the map image",
  }),
  description: Schema.NullOr(Schema.String).annotations({
    description: "A brief description of the map",
  }),
  maximumTimeMinutes: Schema.Number.annotations({
    description: "The maximum time allowed in the map in minutes",
  }),
  requirements: Schema.Array(
    Schema.Struct({
      name: Schema.String.annotations({
        description: "The name of the requirement",
      }),
      value: Schema.String.annotations({
        description: "The value of the requirement",
      }),
    })
  ).annotations({
    description: "The requirements for the map. Empty if none.",
  }),
});

type MapInfo = Schema.Schema.Type<typeof MapInfo>;

const getMapsFromMapsWikiPage = Effect.gen(function* () {
  yield* Effect.log("Getting maps from maps wiki page");

  const wikiService = yield* WikiService;

  const mapsPageContent = yield* wikiService.getPageContent("/wiki/Maps");

  const response = yield* Effect.retry(
    LanguageModel.generateObject({
      prompt: `Extract the maps from this webpage: ${mapsPageContent}`,
      schema: Schema.Struct({
        maps: Schema.Array(MapInfo).annotations({
          description: "The maps listed on the page in the first table",
        }),
      }),
    }).pipe(Effect.provide(WikiScrapingModel)),
    { times: 2 }
  );

  return response?.value?.maps ?? [];
});

const MapPageDetails = Schema.Struct({
  mapImageUrl: Schema.String.annotations({
    description: "The URL of the map image on the page",
  }),
  difficulties: Schema.Array(
    Schema.Struct({
      name: Schema.String.annotations({
        description: "The difficulty id/name",
      }),
      rating: Schema.Number.annotations({
        description:
          "The rating of the difficulty in the form of a percentage of the fraction displayed on the page",
      }),
    })
  ),
});

const makeScrapeMapTask = (mapInfo: MapInfo) =>
  Effect.gen(function* () {
    yield* Effect.log(`Scraping map: ${mapInfo.name}`);

    const wikiService = yield* WikiService;

    const mapPageContent = yield* wikiService.getPageContent(mapInfo.wikiUrl);

    const response = yield* Effect.retry(
      LanguageModel.generateObject({
        prompt: `Extract the map information from this webpage: ${mapPageContent}`,
        schema: MapPageDetails,
      }).pipe(Effect.provide(WikiScrapingModel)),
      { times: 2 }
    );

    const context = yield* IngestionDataContext;

    const mapId = snakeCase(mapInfo.name);

    yield* Ref.update(context.data.maps, (maps) => [
      ...maps,
      {
        id: mapId,
        name: mapInfo.name,
        wikiUrl: mapInfo.wikiUrl,
        imageUrl: mapInfo.imageUrl,
        description: mapInfo.description,
        maximumTimeMinutes: mapInfo.maximumTimeMinutes,
        requirements: [...mapInfo.requirements],
        difficulties: [...(response?.value?.difficulties ?? [])],
      },
    ]);

    yield* Effect.log(`Scraped map: ${mapInfo.name}`);
  });

const scrapeMapsFromWiki = Effect.gen(function* () {
  yield* Effect.log("Scraping maps from wiki");

  const maps = yield* getMapsFromMapsWikiPage;

  yield* Effect.all(maps.map(makeScrapeMapTask), {
    concurrency: 10,
  });
});

const TraderInfo = Schema.Struct({
  name: Schema.String.annotations({
    description: "The name of the trader",
  }),
  wikiUrl: Schema.String.annotations({
    description:
      "The URL path of the trader wiki page (e.g., /wiki/Trader_Name)",
  }),
  imageUrl: Schema.String.annotations({
    description: "The full URL of the trader image",
  }),
  sells: Schema.Array(Schema.String).annotations({
    description: "Categories of items the trader sells",
  }),
});

type TraderInfo = Schema.Schema.Type<typeof TraderInfo>;

const getTradersFromTradersWikiPage = Effect.gen(function* () {
  yield* Effect.log("Getting traders from traders wiki page");

  const wikiService = yield* WikiService;

  const tradersPageContent = yield* wikiService.getPageContent("/wiki/Traders");

  const response = yield* Effect.retry(
    LanguageModel.generateObject({
      prompt: `Extract the list of traders from this webpage: ${tradersPageContent}`,
      schema: Schema.Struct({
        traders: Schema.Array(TraderInfo).annotations({
          description: "The traders listed on the page",
        }),
      }),
    }).pipe(Effect.provide(WikiScrapingModel)),
    { times: 2 }
  );

  return response?.value?.traders ?? [];
});

const TraderPageDetails = Schema.Struct({
  description: Schema.String.annotations({
    description: "A brief markdown formatted summary of the trader",
  }),
  itemsForSale: Schema.Array(
    Schema.Struct({
      itemName: Schema.String.annotations({
        description: "The name of the item",
      }),
      itemPrice: Schema.Number.annotations({
        description: "The price of the item",
      }),
      itemPriceCurrency: Schema.Literal(
        "credits",
        "nature",
        "augment"
      ).annotations({
        description:
          "The currency the item is sold for. This can be found in the .template-price looking at the img src",
      }),
    })
  ).annotations({
    description: "The items the trader sells in their shop",
  }),
});

const makeScrapeTraderTask = (traderInfo: TraderInfo) =>
  Effect.gen(function* () {
    yield* Effect.log(`Scraping trader: ${traderInfo.name}`);

    const wikiService = yield* WikiService;

    const traderPageContent = yield* wikiService.getPageContent(
      traderInfo.wikiUrl
    );

    const response = yield* Effect.retry(
      LanguageModel.generateObject({
        prompt: `Extract the trader information from this webpage: ${traderPageContent}`,
        schema: TraderPageDetails,
      }).pipe(Effect.provide(WikiScrapingModel)),
      { times: 2 }
    );

    const context = yield* IngestionDataContext;
    const fuzzyMatcher = yield* FuzzyMatcher;

    const traderId = snakeCase(traderInfo.name);

    yield* Ref.update(context.data.traders, (traders) => [
      ...traders,
      {
        id: traderId,
        name: traderInfo.name,
        wikiUrl: traderInfo.wikiUrl,
        imageUrl: traderInfo.imageUrl,
        description: response?.value?.description ?? "",
        sellCategories: [...traderInfo.sells],
      },
    ]);

    for (const item of response?.value?.itemsForSale ?? []) {
      const closestItem = yield* fuzzyMatcher.findItem(item.itemName, {
        maxDistance: 2,
      });

      if (Option.isNone(closestItem)) {
        yield* Effect.log(
          `No closest item found for trader item: ${item.itemName}`
        );
        continue;
      }

      const currency =
        item.itemPriceCurrency === "nature" ? "seeds" : item.itemPriceCurrency;

      yield* Ref.update(context.data.traderItemsForSale, (itemsForSale) => [
        ...itemsForSale,
        {
          traderId,
          itemId: closestItem.value.item.id,
          currency: currency as "credits" | "seeds" | "augment",
        },
      ]);
    }

    yield* Effect.log(`Scraped trader: ${traderInfo.name}`);
  });

const scrapeTradersFromWiki = Effect.gen(function* () {
  yield* Effect.log("Scraping traders from wiki");

  const traders = yield* getTradersFromTradersWikiPage;

  yield* Effect.all(traders.map(makeScrapeTraderTask), {
    concurrency: 10,
  });
});

const updateItemsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const items = yield* Ref.get(context.data.items);

  yield* databaseService.items.sync(items);
});

const updateItemRecipesInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const itemRecipes = yield* Ref.get(context.data.itemRecipes);

  yield* databaseService.itemRecipes.sync(itemRecipes);
});

const updateItemRecyclesInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const itemRecycles = yield* Ref.get(context.data.itemRecycles);

  yield* databaseService.itemRecycles.sync(itemRecycles);
});

const updateItemSalvagesInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const itemSalvages = yield* Ref.get(context.data.itemSalvages);

  yield* databaseService.itemSalvages.sync(itemSalvages);
});

const updateQuestsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const quests = yield* Ref.get(context.data.quests);

  yield* databaseService.quests.sync(quests);
});

const updateQuestObjectivesInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const questObjectives = yield* Ref.get(context.data.questObjectives);

  yield* databaseService.questObjectives.sync(questObjectives);
});

const updateQuestRewardItemsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const questRewardItems = yield* Ref.get(context.data.questRewardItems);

  yield* databaseService.questRewardItems.sync(questRewardItems);
});

const updateQuestPrerequisitesInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const questPrerequisites = yield* Ref.get(context.data.questPrerequisites);

  yield* databaseService.questPrerequisites.sync(questPrerequisites);
});

const updateQuestNextQuestsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const questNextQuests = yield* Ref.get(context.data.questNextQuests);

  yield* databaseService.questNextQuests.sync(questNextQuests);
});

const updateHideoutStationsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const hideoutStations = yield* Ref.get(context.data.hideoutStations);

  yield* databaseService.hideoutStations.sync(hideoutStations);
});

const updateHideoutStationLevelsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const hideoutStationLevels = yield* Ref.get(
    context.data.hideoutStationLevels
  );

  yield* databaseService.hideoutStationLevels.sync(hideoutStationLevels);
});

const updateHideoutStationLevelRequirementsInDatabase = Effect.gen(
  function* () {
    const databaseService = yield* DatabaseService;
    const context = yield* IngestionDataContext;

    const hideoutStationLevelRequirements = yield* Ref.get(
      context.data.hideoutStationLevelRequirements
    );

    yield* databaseService.hideoutStationLevelRequirements.sync(
      hideoutStationLevelRequirements
    );
  }
);

const updateMapsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const maps = yield* Ref.get(context.data.maps);

  yield* databaseService.maps.sync(maps);
});

const updateArcsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const arcs = yield* Ref.get(context.data.arcs);

  yield* databaseService.arcs.sync(arcs);
});

const updateArcLootItemsInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const arcLootItems = yield* Ref.get(context.data.arcLootItems);

  yield* databaseService.arcLootItems.sync(arcLootItems);
});

const updateTradersInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const traders = yield* Ref.get(context.data.traders);

  yield* databaseService.traders.sync(traders);
});

const updateTraderItemsForSaleInDatabase = Effect.gen(function* () {
  const databaseService = yield* DatabaseService;
  const context = yield* IngestionDataContext;

  const traderItemsForSale = yield* Ref.get(context.data.traderItemsForSale);

  yield* databaseService.traderItemsForSale.sync(traderItemsForSale);
});

const syncMeilisearchIndexes = Effect.gen(function* () {
  yield* Effect.log("Syncing meilisearch indexes");

  const context = yield* IngestionDataContext;
  const meilisearchService = yield* MeilisearchService;

  const items = yield* Ref.get(context.data.items);
  const quests = yield* Ref.get(context.data.quests);
  const hideoutStations = yield* Ref.get(context.data.hideoutStations);
  const maps = yield* Ref.get(context.data.maps);
  const arcs = yield* Ref.get(context.data.arcs);
  const traders = yield* Ref.get(context.data.traders);

  yield* meilisearchService.syncIndex(
    "items",
    items.map((item) => onlyPrimitiveValues(item)),
    {
      searchableAttributes: ["name", "description", "category"],
    }
  );

  yield* meilisearchService.syncIndex(
    "quests",
    quests.map((quest) => onlyPrimitiveValues(quest)),
    {
      searchableAttributes: ["name", "description"],
    }
  );

  yield* meilisearchService.syncIndex(
    "hideoutStations",
    hideoutStations.map((hideoutStation) =>
      onlyPrimitiveValues(hideoutStation)
    ),
    {
      searchableAttributes: ["name", "description"],
    }
  );

  yield* meilisearchService.syncIndex(
    "maps",
    maps.map((map) => onlyPrimitiveValues(map)),
    {
      searchableAttributes: ["name", "description"],
    }
  );

  yield* meilisearchService.syncIndex(
    "arcs",
    arcs.map((arc) => onlyPrimitiveValues(arc)),
    {
      searchableAttributes: ["name", "description", "threatLevel"],
    }
  );

  yield* meilisearchService.syncIndex(
    "traders",
    traders.map((trader) => onlyPrimitiveValues(trader)),
    {
      searchableAttributes: ["name", "description"],
    }
  );

  yield* Effect.log("Meilisearch indexes synced");
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

  yield* Effect.all(
    [scrapeArcsFromWiki, scrapeMapsFromWiki, scrapeTradersFromWiki],
    { concurrency: "unbounded" }
  );

  yield* Effect.all([
    updateItemsInDatabase,
    updateItemRecipesInDatabase,
    updateItemRecyclesInDatabase,
    updateItemSalvagesInDatabase,
    updateQuestsInDatabase,
    updateQuestObjectivesInDatabase,
    updateQuestRewardItemsInDatabase,
    updateQuestPrerequisitesInDatabase,
    updateQuestNextQuestsInDatabase,
    updateHideoutStationsInDatabase,
    updateHideoutStationLevelsInDatabase,
    updateHideoutStationLevelRequirementsInDatabase,
    updateMapsInDatabase,
    updateArcsInDatabase,
    updateArcLootItemsInDatabase,
    updateTradersInDatabase,
    updateTraderItemsForSaleInDatabase,
  ]);

  yield* syncMeilisearchIndexes;

  yield* Effect.log("Ingestion program completed");
});

const HttpLive = FetchHttpClient.layer;

const OpenRouterLive = OpenRouterClient.layerConfig({
  apiKey: Config.redacted("OPENROUTER_API_KEY"),
}).pipe(Layer.provide(HttpLive));

const MainLive = Layer.mergeAll(
  IngestionDataContextLive,
  FuzzyMatcherLive,
  OpenRouterLive,
  HttpLive,
  WikiServiceLive.pipe(Layer.provide(HttpLive)),
  DatabaseServiceLive,
  MeilisearchServiceLive
);

Effect.runPromise(program.pipe(Effect.provide(MainLive)));
