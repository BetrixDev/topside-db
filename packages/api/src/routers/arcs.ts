import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const arcsRouter = {
  getArc: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "arcs" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const arc = await context.db.query.arcs.findFirst({
        where: eq(Tables.arcs.id, input.id),
      });

      if (!arc) {
        return null;
      }

      // Fetch item details for loot (stored as item names)
      const lootNames = arc.loot || [];
      const lootItems =
        lootNames.length > 0
          ? await context.db.query.items.findMany({
              where: inArray(Tables.items.name, lootNames),
              columns: {
                id: true,
                name: true,
                imageFilename: true,
                rarity: true,
                value: true,
                type: true,
              },
            })
          : [];

      const lootItemMap = new Map(lootItems.map((i) => [i.name, i]));

      // Enrich loot with item details where available
      const lootDetails = lootNames.map((lootName) => ({
        name: lootName,
        item: lootItemMap.get(lootName) || null,
      }));

      // Group attacks by type for organized display
      const attacks = arc.attacks || [];
      const attacksByType = attacks.reduce((acc, attack) => {
        const type = attack.type || "Unknown";
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(attack.description);
        return acc;
      }, {} as Record<string, string[]>);

      // Calculate total potential loot value
      const totalLootValue = lootDetails.reduce(
        (total, loot) => total + (loot.item?.value ?? 0),
        0
      );

      // Get unique loot rarities for display
      const lootRarities = [
        ...new Set(
          lootDetails
            .map((l) => l.item?.rarity)
            .filter((r): r is string => r != null)
        ),
      ];

      return {
        ...arc,
        lootDetails,
        attacksByType,
        totalLootValue,
        lootRarities,
        stats: {
          totalAttacks: attacks.length,
          totalWeaknesses: (arc.weaknesses || []).length,
          totalLoot: lootNames.length,
          matchedLootItems: lootItems.length,
          hasArmorPlating: !!arc.armorPlating,
          threatLevelKnown: !!arc.threatLevel,
        },
      };
    }),
};
