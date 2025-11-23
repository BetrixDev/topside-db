import { publicProcedure } from "../index";
import { z } from "zod";
import { MeiliSearch } from "meilisearch";
import { cacheMiddleware } from "../middleware/cache";

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
});

export const searchRouter = {
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .use(cacheMiddleware())
    .output(
      z.object({
        hits: z.array(
          z.union([
            z.object({
              kind: z.literal("items"),
              id: z.string(),
              name: z.string(),
              type: z.string(),
              imageFilename: z.string().nullish(),
            }),
            z.object({
              kind: z.literal("quests"),
              id: z.string(),
              name: z.string(),
              trader: z.string(),
            }),
            z.object({
              kind: z.literal("hideouts"),
              id: z.string(),
              name: z.string(),
            }),
            z.object({
              kind: z.literal("maps"),
              id: z.string(),
              name: z.string(),
              description: z.string().nullish(),
              maximumTimeMinutes: z.number().nullish(),
              imageUrl: z.string().nullish(),
            }),
            z.object({
              kind: z.literal("arcs"),
              id: z.string(),
              name: z.string(),
              description: z.string().nullish(),
              threatLevel: z.string().nullish(),
              imageUrl: z.string().nullish(),
              health: z.number().nullish(),
            }),
            z.object({
              kind: z.literal("traders"),
              id: z.string(),
              name: z.string(),
              description: z.string().nullish(),
              imageUrl: z.string().nullish(),
            }),
          ])
        ),
        processingTimeMs: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const { query } = input;

      const { results } = await meilisearch.multiSearch({
        queries: [
          {
            indexUid: "items",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name", "description"],
          },
          {
            indexUid: "quests",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name", "description", "trader"],
          },
          {
            indexUid: "hideouts",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name"],
          },
          {
            indexUid: "maps",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name", "description"],
          },
          {
            indexUid: "arcs",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name", "description"],
          },
          {
            indexUid: "traders",
            q: query,
            limit: 10,
            attributesToSearchOn: ["name", "description"],
          },
        ],
      });

      const hits = results.flatMap((result) =>
        result.hits.map((hit) => ({
          ...(hit as any),
          kind: result.indexUid, // "items", "quests", "hideouts"
        }))
      );

      return {
        hits,
        processingTimeMs: results.reduce(
          (acc, result) => acc + result.processingTimeMs,
          0
        ),
      };
    }),
};
