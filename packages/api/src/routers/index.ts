import { publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { searchRouter } from "./search";
import { itemsRouter } from "./items";
import { analyticsRouter } from "./analytics";
import { questsRouter } from "./quests";
import { tradersRouter } from "./traders";
import { hideoutsRouter } from "./hideouts";
import { mapsRouter } from "./maps";
import { arcsRouter } from "./arcs";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  search: searchRouter,
  items: itemsRouter,
  analytics: analyticsRouter,
  quests: questsRouter,
  traders: tradersRouter,
  hideouts: hideoutsRouter,
  maps: mapsRouter,
  arcs: arcsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
