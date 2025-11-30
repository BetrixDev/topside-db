import { Context, Effect, Option, Ref } from "effect";
import { Tables } from "@topside-db/db";
import {
  findClosestMatch,
  type FuzzyMatch,
  type FuzzyMatchOptions,
} from "@topside-db/utils";

type Item = typeof Tables.items.$inferInsert;
type Quest = typeof Tables.quests.$inferInsert;
type HideoutStation = typeof Tables.hideoutStations.$inferInsert;
type Arc = typeof Tables.arcs.$inferInsert;

export type DataType = "items" | "quests" | "arcs" | "hideoutStations";

export type NamedEntity = { name: string | null };

export type TypedFuzzyMatch<T extends NamedEntity> = FuzzyMatch<T> & {
  type: DataType;
};

export type FuzzyMatcherData = {
  items: Ref.Ref<Item[]>;
  quests: Ref.Ref<Quest[]>;
  hideoutStations: Ref.Ref<HideoutStation[]>;
  arcs: Ref.Ref<Arc[]>;
};

/**
 * FuzzyMatcher service for finding closest matches using Levenshtein distance
 * from the ingestion data context.
 */
export class FuzzyMatcher extends Context.Tag("FuzzyMatcher")<
  FuzzyMatcher,
  {
    readonly findItem: (
      targetName: string,
      options?: FuzzyMatchOptions
    ) => Effect.Effect<Option.Option<FuzzyMatch<Item>>>;

    readonly findQuest: (
      targetName: string,
      options?: FuzzyMatchOptions
    ) => Effect.Effect<Option.Option<FuzzyMatch<Quest>>>;

    readonly findArc: (
      targetName: string,
      options?: FuzzyMatchOptions
    ) => Effect.Effect<Option.Option<FuzzyMatch<Arc>>>;

    readonly findHideoutStation: (
      targetName: string,
      options?: FuzzyMatchOptions
    ) => Effect.Effect<Option.Option<FuzzyMatch<HideoutStation>>>;

    readonly findAcrossAll: (
      targetName: string,
      options?: FuzzyMatchOptions & { dataTypes?: DataType[] }
    ) => Effect.Effect<Option.Option<TypedFuzzyMatch<NamedEntity>>>;
  }
>() {}

const getName = (entity: NamedEntity) => entity.name;

/**
 * Creates the FuzzyMatcher service implementation from the provided data refs.
 */
export const makeFuzzyMatcherService = (
  data: FuzzyMatcherData
): Context.Tag.Service<FuzzyMatcher> => ({
  findItem: (targetName, options) =>
    Effect.gen(function* () {
      const items = yield* Ref.get(data.items);
      const match = findClosestMatch(targetName, items, getName, options);
      return match ? Option.some(match) : Option.none();
    }),

  findQuest: (targetName, options) =>
    Effect.gen(function* () {
      const quests = yield* Ref.get(data.quests);
      const match = findClosestMatch(targetName, quests, getName, options);
      return match ? Option.some(match) : Option.none();
    }),

  findArc: (targetName, options) =>
    Effect.gen(function* () {
      const arcs = yield* Ref.get(data.arcs);
      const match = findClosestMatch(targetName, arcs, getName, options);
      return match ? Option.some(match) : Option.none();
    }),

  findHideoutStation: (targetName, options) =>
    Effect.gen(function* () {
      const hideoutStations = yield* Ref.get(data.hideoutStations);
      const match = findClosestMatch(
        targetName,
        hideoutStations,
        getName,
        options
      );
      return match ? Option.some(match) : Option.none();
    }),

  findAcrossAll: (targetName, options) =>
    Effect.gen(function* () {
      const dataTypes = options?.dataTypes ?? [
        "items",
        "quests",
        "arcs",
        "hideoutStations",
      ];

      let bestMatch: TypedFuzzyMatch<NamedEntity> | null = null;

      const checkAndUpdateBest = (
        match: FuzzyMatch<NamedEntity> | null,
        type: DataType
      ) => {
        if (match) {
          if (bestMatch === null || match.distance < bestMatch.distance) {
            bestMatch = { ...match, type };
          }
        }
      };

      if (dataTypes.includes("items")) {
        const items = yield* Ref.get(data.items);
        checkAndUpdateBest(
          findClosestMatch(targetName, items, getName, options),
          "items"
        );
      }

      if (dataTypes.includes("quests")) {
        const quests = yield* Ref.get(data.quests);
        checkAndUpdateBest(
          findClosestMatch(targetName, quests, getName, options),
          "quests"
        );
      }

      if (dataTypes.includes("arcs")) {
        const arcs = yield* Ref.get(data.arcs);
        checkAndUpdateBest(
          findClosestMatch(targetName, arcs, getName, options),
          "arcs"
        );
      }

      if (dataTypes.includes("hideoutStations")) {
        const hideoutStations = yield* Ref.get(data.hideoutStations);
        checkAndUpdateBest(
          findClosestMatch(targetName, hideoutStations, getName, options),
          "hideoutStations"
        );
      }

      return bestMatch ? Option.some(bestMatch) : Option.none();
    }),
});

