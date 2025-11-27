import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, or } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const tradersRouter = {
  getTrader: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "traders" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      // Use relational query with nested item data
      const trader = await context.db.query.traders.findFirst({
        where: eq(Tables.traders.id, input.id),
        with: {
          itemsForSale: {
            with: {
              item: {
                columns: {
                  id: true,
                  name: true,
                  imageFilename: true,
                  rarity: true,
                  value: true,
                  type: true,
                  stackSize: true,
                },
              },
            },
          },
        },
      });

      if (!trader) {
        return null;
      }

      // Fetch quests given by this trader (match by name or id)
      const quests = await context.db.query.quests.findMany({
        where: or(
          eq(Tables.quests.trader, trader.name),
          eq(Tables.quests.trader, trader.id)
        ),
        columns: {
          id: true,
          name: true,
          description: true,
          xp: true,
        },
        with: {
          objectives: {
            orderBy: (objectives, { asc }) => [asc(objectives.orderIndex)],
            columns: {
              text: true,
            },
          },
        },
      });

      // Group items by currency type
      type EnrichedItem = (typeof trader.itemsForSale)[number];
      const itemsByCurrency = {
        credits: [] as EnrichedItem[],
        seeds: [] as EnrichedItem[],
        augment: [] as EnrichedItem[],
      };

      trader.itemsForSale.forEach((sale) => {
        const bucket =
          itemsByCurrency[sale.currency as keyof typeof itemsByCurrency];
        bucket.push(sale);
      });

      // Sort items within each currency group by name
      Object.values(itemsByCurrency).forEach((items) => {
        items.sort((a, b) =>
          (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId)
        );
      });

      // Calculate stats
      const totalItemsForSale = trader.itemsForSale.length;
      const uniqueCategories = trader.sellCategories?.length ?? 0;

      return {
        ...trader,
        itemsByCurrency,
        quests,
        stats: {
          totalItemsForSale,
          uniqueCategories,
          totalQuests: quests.length,
        },
      };
    }),
};
