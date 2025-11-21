import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray } from "@topside-db/db";

export const itemsRouter = {
  getItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const item = await context.db.query.items.findFirst({
        where: eq(Tables.items.id, input.id),
        with: {
          effects: true,
          recipes: true,
          recycles: true,
          salvages: true,
        },
      });

      if (!item) {
        return null;
      }

      // Fetch related items for recipes and recycles
      const recipeMaterialIds = item.recipes.map((r) => r.materialId);
      const recycleMaterialIds = item.recycles.map((r) => r.materialId);
      const allMaterialIds = [
        ...new Set([...recipeMaterialIds, ...recycleMaterialIds]),
      ];

      const relatedItems =
        allMaterialIds.length > 0
          ? await context.db.query.items.findMany({
              where: inArray(Tables.items.id, allMaterialIds),
            })
          : [];

      // Map material IDs to item details
      const materialMap = new Map(relatedItems.map((i) => [i.id, i]));

      return {
        ...item,
        recipes: item.recipes.map((r) => ({
          ...r,
          material: materialMap.get(r.materialId),
        })),
        recycles: item.recycles.map((r) => ({
          ...r,
          material: materialMap.get(r.materialId),
        })),
      };
    }),
};
