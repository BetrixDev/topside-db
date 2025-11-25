import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray, sql, aliasedTable } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const itemsRouter = {
  getItem: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "items" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const item = await context.db.query.items.findFirst({
        where: eq(Tables.items.id, input.id),
        with: {
          recipes: true,
          recycles: true,
          salvages: true,
          traders: {
            with: {
              trader: {
                columns: {
                  name: true,
                  id: true,
                  imageUrl: true,
                },
              },
            },
          },
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

      // Calculate recycled value
      const recycledValue = item.recycles.reduce((total, r) => {
        const material = materialMap.get(r.materialId);
        return total + (material?.value || 0) * r.quantity;
      }, 0);

      return {
        ...item,
        recycledValue,
        isRecycleWorthIt: recycledValue > (item.value || 0),
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
  recycleValueList: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "items:recycle" }))
    .output(
      z.array(
        z.object({
          itemId: z.string(),
          itemName: z.string(),
          originalValue: z.number().nullish(),
          recycledValue: z.number().nullish(),
          recycleYieldPct: z.coerce.number().nullish(),
        })
      )
    )
    .handler(async ({ context }) => {
      const materials = aliasedTable(Tables.items, "materials");

      const recycledValue = sql<number>`
        COALESCE(SUM(${Tables.itemRecycles.quantity} * ${materials.value}), 0)
      `;

      const recycleYieldPct = sql<number>`
        ROUND(
          (
            ${recycledValue}
            / NULLIF(${Tables.items.value}, 0)
          )::numeric,
          2
        )
      `;

      const rows = await context.db
        .select({
          itemId: Tables.items.id,
          itemName: Tables.items.name,
          originalValue: Tables.items.value,
          recycledValue: recycledValue,
          recycleYieldPct: recycleYieldPct,
        })
        .from(Tables.items)
        .innerJoin(
          Tables.itemRecycles,
          eq(Tables.itemRecycles.itemId, Tables.items.id)
        )
        .leftJoin(materials, eq(materials.id, Tables.itemRecycles.materialId))
        .groupBy(Tables.items.id, Tables.items.name, Tables.items.value)
        .orderBy(sql`${recycleYieldPct} DESC NULLS LAST`);

      return rows;
    }),
};
