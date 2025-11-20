import { publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { searchRouter } from "./search";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  search: searchRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
