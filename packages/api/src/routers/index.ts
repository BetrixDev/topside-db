import { publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { searchRouter } from "./search";
import { itemsRouter } from "./items";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  search: searchRouter,
  items: itemsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
