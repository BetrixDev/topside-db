import type { Context as HonoContext } from "hono";
import { db } from "@topside-db/db";
import { redis } from "@topside-db/redis";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  return {
    headers: context.req.header(),
    db,
    redis,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
