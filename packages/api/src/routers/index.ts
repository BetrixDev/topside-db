import { publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { searchRouter } from "./search";
import { itemsRouter } from "./items";
import { analyticsRouter } from "./analytics";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  search: searchRouter,
  items: itemsRouter,
  analytics: analyticsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
