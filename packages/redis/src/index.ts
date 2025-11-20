import { createClient, type RedisClientType } from "redis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis: RedisClientType = createClient({
  url: redisUrl,
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

await redis.connect();

export { createClient } from "redis";
export type { RedisClientType } from "redis";
