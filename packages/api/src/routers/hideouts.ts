import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const hideoutsRouter = {
  getHideout: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "hideouts" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const hideout = await context.db.query.hideouts.findFirst({
        where: eq(Tables.hideouts.id, input.id),
        with: {
          levels: {
            orderBy: (levels, { asc }) => [asc(levels.level)],
          },
          requirements: true,
        },
      });

      if (!hideout) {
        return null;
      }

      // Fetch item details for all required items
      const itemIds = [...new Set(hideout.requirements.map((r) => r.itemId))];
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
              },
            })
          : [];

      const itemMap = new Map(items.map((i) => [i.id, i]));

      // Group requirements by level
      const requirementsByLevel = new Map<
        number,
        Array<{
          itemId: string;
          quantity: number;
          item: (typeof items)[0] | undefined;
        }>
      >();

      hideout.requirements.forEach((req) => {
        const levelReqs = requirementsByLevel.get(req.level) || [];
        levelReqs.push({
          itemId: req.itemId,
          quantity: req.quantity,
          item: itemMap.get(req.itemId),
        });
        requirementsByLevel.set(req.level, levelReqs);
      });

      // Calculate total items needed across all levels
      const totalItemsRequired = hideout.requirements.reduce(
        (sum, r) => sum + r.quantity,
        0
      );

      // Calculate total value of all required items
      const totalValueRequired = hideout.requirements.reduce((sum, r) => {
        const item = itemMap.get(r.itemId);
        return sum + (item?.value || 0) * r.quantity;
      }, 0);

      // Unique items required
      const uniqueItemsRequired = itemIds.length;

      // Build levels with their requirements
      const levelsWithRequirements = hideout.levels.map((level) => ({
        ...level,
        requirements: requirementsByLevel.get(level.level) || [],
        totalItemsForLevel: (requirementsByLevel.get(level.level) || []).reduce(
          (sum, r) => sum + r.quantity,
          0
        ),
        totalValueForLevel: (requirementsByLevel.get(level.level) || []).reduce(
          (sum, r) => sum + (r.item?.value || 0) * r.quantity,
          0
        ),
      }));

      return {
        ...hideout,
        levels: levelsWithRequirements,
        stats: {
          totalItemsRequired,
          totalValueRequired,
          uniqueItemsRequired,
        },
      };
    }),
};
