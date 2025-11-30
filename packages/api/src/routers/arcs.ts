import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const arcsRouter = {
  getArc: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "arcs" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const arc = await context.db.query.arcs.findFirst({
        where: eq(Tables.arcs.id, input.id),
        with: {
          arcLootItems: {
            with: {
              item: {
                columns: {
                  id: true,
                  name: true,
                  imageFilename: true,
                  rarity: true,
                  value: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!arc) {
        return null;
      }

      // Build loot details directly from related items
      const lootDetails =
        arc.arcLootItems?.map((loot) => ({
          name: loot.item?.name ?? "Unknown item",
          item: loot.item ?? null,
        })) ?? [];

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
          totalLoot: lootDetails.length,
          matchedLootItems: lootDetails.filter((l) => l.item !== null).length,
          hasArmorPlating: !!arc.armorPlating,
          threatLevelKnown: !!arc.threatLevel,
        },
      };
    }),
};
