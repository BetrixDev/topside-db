import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables } from "@topside-db/db";

export const itemsRouter = {
  getItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const item = await context.db.query.items.findFirst({
        where: eq(Tables.items.id, input.id),
      });

      return item;
    }),
};
