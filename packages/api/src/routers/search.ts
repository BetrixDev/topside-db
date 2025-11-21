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
    .use(cacheMiddleware)
    .handler(async ({ input }) => {
      const { query } = input;

      const index = meilisearch.index("items");
      const searchResult = await index.search(query, {
        limit: 20,
        attributesToSearchOn: ["name", "description", "type"],
      });

      return searchResult;
    }),
};
