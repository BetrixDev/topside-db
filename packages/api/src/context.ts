import { db } from "@topside-db/db";
import { redis } from "@topside-db/redis";

export type CreateContextOptions = {
  request: Request;
};

export async function createContext({ request }: CreateContextOptions) {
  return {
    headers: request.headers,
    db,
    redis,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
