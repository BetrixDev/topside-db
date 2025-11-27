import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, sql, aliasedTable } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const itemsRouter = {
  getItem: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "items" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const item = await context.db.query.items.findFirst({
        where: eq(Tables.items.id, input.id),
        with: {
          recipes: {
            with: {
              material: {
                columns: {
                  name: true,
                  id: true,
                  imageFilename: true,
                },
              },
            },
          },
          recycles: {
            with: {
              material: {
                columns: {
                  name: true,
                  id: true,
                  imageFilename: true,
                  value: true,
                },
              },
            },
          },
          salvages: {
            with: {
              material: {
                columns: {
                  name: true,
                  id: true,
                  imageFilename: true,
                },
              },
            },
          },
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
          hideoutRequirements: {
            columns: {
              quantity: true,
              level: true,
            },
            with: {
              hideout: {
                columns: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          questsRewards: {
            columns: {
              quantity: true,
            },
            with: {
              quest: {
                columns: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!item) {
        return null;
      }

      // Calculate recycled value from material relations
      const recycledValue = item.recycles.reduce(
        (total, r) => total + (r.material?.value ?? 0) * r.quantity,
        0
      );

      return {
        ...item,
        recycledValue,
        isRecycleWorthIt: recycledValue > (item.value ?? 0),
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
