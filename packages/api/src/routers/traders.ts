import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const tradersRouter = {
  getTrader: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "traders" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const trader = await context.db.query.traders.findFirst({
        where: eq(Tables.traders.id, input.id),
        with: {
          itemsForSale: true,
        },
      });

      if (!trader) {
        return null;
      }

      // Fetch item details for all items the trader sells
      const itemIds = trader.itemsForSale.map((i) => i.itemId);
      const items =
        itemIds.length > 0
          ? await context.db.query.items.findMany({
              where: inArray(Tables.items.id, itemIds),
              columns: {
                id: true,
                name: true,
                imageFilename: true,
                rarity: true,
                value: true,
                type: true,
                stackSize: true,
              },
            })
          : [];

      const itemMap = new Map(items.map((i) => [i.id, i]));

      // Group items by currency type
      const itemsByCurrency = {
        credits: [] as typeof enrichedItems,
        seeds: [] as typeof enrichedItems,
        augment: [] as typeof enrichedItems,
      };

      const enrichedItems = trader.itemsForSale.map((sale) => ({
        ...sale,
        item: itemMap.get(sale.itemId),
      }));

      enrichedItems.forEach((sale) => {
        itemsByCurrency[sale.currency].push(sale);
      });

      // Calculate totals
      const totalItemsForSale = trader.itemsForSale.length;
      const uniqueCategories = trader.sellCategories?.length || 0;

      return {
        ...trader,
        itemsForSale: enrichedItems,
        itemsByCurrency,
        stats: {
          totalItemsForSale,
          uniqueCategories,
          currencyBreakdown: {
            credits: itemsByCurrency.credits.length,
            seeds: itemsByCurrency.seeds.length,
            augment: itemsByCurrency.augment.length,
          },
        },
      };
    }),
};
