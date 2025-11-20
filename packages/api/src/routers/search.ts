import { publicProcedure } from "../index";
import { z } from "zod";
import { MeiliSearch } from "meilisearch";

const searchInputSchema = z.object({
  query: z.string(),
});

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
});

export const searchRouter = {
  search: publicProcedure
    .input(searchInputSchema)
    .handler(async ({ input }) => {
      const { query } = input;

      const index = meilisearch.index("items");
      const searchResult = await index.search(query, {
        limit: 20,
      });

      return searchResult.hits;
    }),
};

