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

      // Try to find items that match the loot names
      // Loot is stored as string array of item names/descriptions
      const lootItems =
        arc.loot && arc.loot.length > 0
          ? await context.db.query.items.findMany({
              where: inArray(Tables.items.name, arc.loot),
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
      const enrichedLoot = (arc.loot || []).map((lootName) => ({
        name: lootName,
        item: lootItemMap.get(lootName) || null,
      }));

      // Calculate stats
      const totalAttacks = (arc.attacks || []).length;
      const totalWeaknesses = (arc.weaknesses || []).length;
      const totalLoot = (arc.loot || []).length;

      // Group attacks by type
      const attacksByType = (arc.attacks || []).reduce((acc, attack) => {
        const type = attack.type || "Unknown";
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(attack.description);
        return acc;
      }, {} as Record<string, string[]>);

      return {
        ...arc,
        lootDetails: enrichedLoot,
        attacksByType,
        stats: {
          totalAttacks,
          totalWeaknesses,
          totalLoot,
          hasArmorPlating: !!arc.armorPlating,
          threatLevelKnown: !!arc.threatLevel,
        },
      };
    }),
};
