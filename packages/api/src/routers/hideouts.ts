import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

const hideoutsRouterImpl = {
  getHideout: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "hideouts" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const hideoutStation = await context.db.query.hideoutStations.findFirst({
        where: eq(Tables.hideoutStations.id, input.id),
        with: {
          levels: {
            orderBy: (levels, { asc }) => [asc(levels.level)],
          },
          requirements: {
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

      if (!hideoutStation) {
        return null;
      }

      const requirements = hideoutStation.requirements ?? [];

      // Group requirements by level
      const requirementsByLevel = new Map<
        number,
        Array<{
          itemId: string;
          quantity: number;
          item: (typeof hideoutStation.requirements)[number]["item"] | null;
        }>
      >();

      requirements.forEach((req) => {
        const levelReqs = requirementsByLevel.get(req.level) || [];
        levelReqs.push({
          itemId: req.itemId,
          quantity: req.quantity,
          item: req.item ?? null,
        });
        requirementsByLevel.set(req.level, levelReqs);
      });

      // Calculate total items needed across all levels
      const totalItemsRequired = requirements.reduce(
        (sum, r) => sum + r.quantity,
        0
      );

      // Calculate total value of all required items
      const totalValueRequired = requirements.reduce(
        (sum, r) => sum + (r.item?.value || 0) * r.quantity,
        0
      );

      // Unique items required
      const uniqueItemsRequired = new Set(requirements.map((r) => r.itemId))
        .size;

      // Build levels with their requirements
      const levelsWithRequirements = hideoutStation.levels.map((level) => {
        const levelReqs = requirementsByLevel.get(level.level) || [];
        return {
          ...level,
          requirements: levelReqs,
          totalItemsForLevel: levelReqs.reduce((sum, r) => sum + r.quantity, 0),
          totalValueForLevel: levelReqs.reduce(
            (sum, r) => sum + (r.item?.value || 0) * r.quantity,
            0
          ),
        };
      });

      return {
        ...hideoutStation,
        levels: levelsWithRequirements,
        stats: {
          totalItemsRequired,
          totalValueRequired,
          uniqueItemsRequired,
        },
      };
    }),
};

export const hideoutsRouter: typeof hideoutsRouterImpl = hideoutsRouterImpl;
