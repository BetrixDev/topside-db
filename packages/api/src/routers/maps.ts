import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const mapsRouter = {
  getMap: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "maps" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const map = await context.db.query.maps.findFirst({
        where: eq(Tables.maps.id, input.id),
      });

      if (!map) {
        return null;
      }

      // Format time for display
      const hours = Math.floor(map.maximumTimeMinutes / 60);
      const minutes = map.maximumTimeMinutes % 60;
      const formattedMaxTime =
        hours > 0
          ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
          : `${minutes}m`;

      // Calculate average difficulty rating
      const difficulties = map.difficulties || [];
      const avgDifficulty =
        difficulties.length > 0
          ? difficulties.reduce((sum, d) => sum + d.rating, 0) /
            difficulties.length
          : null;

      // Get difficulty breakdown
      const difficultyBreakdown = difficulties.reduce((acc, d) => {
        acc[d.name] = d.rating;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...map,
        formattedMaxTime,
        stats: {
          avgDifficulty: avgDifficulty
            ? Math.round(avgDifficulty * 100) / 100
            : null,
          requirementCount: (map.requirements || []).length,
          difficultyCategories: difficulties.length,
        },
        difficultyBreakdown,
      };
    }),
};
