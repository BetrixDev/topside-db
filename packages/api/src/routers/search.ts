import { publicProcedure } from "../index";
import { MeiliSearch } from "meilisearch";
import { cacheMiddleware } from "../middleware/cache";
import {
  searchInputSchema,
  type SearchHit,
  type SearchCategory,
  type SearchResult,
} from "@topside-db/schemas";

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
});

type IndexConfig = {
  indexUid: SearchCategory;
  attributesToSearchOn: string[];
  weight: number;
};

const INDEX_CONFIGS: IndexConfig[] = [
  {
    indexUid: "items",
    attributesToSearchOn: ["name"],
    weight: 1.0,
  },
  {
    indexUid: "quests",
    attributesToSearchOn: ["name"],
    weight: 1.0,
  },
  {
    indexUid: "hideouts",
    attributesToSearchOn: ["name"],
    weight: 1.0,
  },
  {
    indexUid: "maps",
    attributesToSearchOn: ["name"],
    weight: 2.0,
  },
  {
    indexUid: "arcs",
    attributesToSearchOn: ["name"],
    weight: 1.0,
  },
  {
    indexUid: "traders",
    attributesToSearchOn: ["name"],
    weight: 2.0,
  },
];

export const searchRouter = {
  search: publicProcedure
    .input(searchInputSchema)
    .use(cacheMiddleware())
    .handler(async ({ input }): Promise<SearchResult<SearchHit>> => {
      const { query, category, limit, offset } = input;

      const configs = category
        ? INDEX_CONFIGS.filter((c) => c.indexUid === category)
        : INDEX_CONFIGS;

      if (category) {
        const index = meilisearch.index(category);
        const config = configs[0]!;

        const result = await index.search(query, {
          limit,
          offset,
          attributesToSearchOn: config.attributesToSearchOn,
        });

        const hits = result.hits.map((hit) => ({
          ...(hit as Record<string, unknown>),
          kind: category,
        })) as SearchHit[];

        return {
          hits,
          totalHits: result.estimatedTotalHits ?? result.hits.length,
          processingTimeMs: result.processingTimeMs,
          limit,
          offset,
        };
      }

      const response = await meilisearch.multiSearch({
        federation: {
          limit,
          offset,
        },
        queries: configs.map((config) => ({
          indexUid: config.indexUid,
          q: query,
          attributesToSearchOn: config.attributesToSearchOn,
          federationOptions: {
            weight: config.weight,
          },
        })),
      });

      const hits = response.hits.map((hit) => ({
        ...(hit as Record<string, unknown>),
        kind: hit._federation!.indexUid as SearchCategory,
      })) as SearchHit[];

      return {
        hits,
        totalHits: response.estimatedTotalHits ?? hits.length,
        processingTimeMs: response.processingTimeMs,
        limit,
        offset,
      };
    }),

  searchByCategory: publicProcedure
    .input(searchInputSchema.required({ category: true }))
    .use(cacheMiddleware())
    .handler(async ({ input }): Promise<SearchResult<SearchHit>> => {
      const { query, category, limit, offset } = input;

      const config = INDEX_CONFIGS.find((c) => c.indexUid === category)!;
      const index = meilisearch.index(category);

      const result = await index.search(query, {
        limit,
        offset,
        attributesToSearchOn: config.attributesToSearchOn,
      });

      const hits = result.hits.map((hit) => ({
        ...(hit as Record<string, unknown>),
        kind: category,
      })) as SearchHit[];

      return {
        hits,
        totalHits: result.estimatedTotalHits ?? result.hits.length,
        processingTimeMs: result.processingTimeMs,
        limit,
        offset,
      };
    }),
};
