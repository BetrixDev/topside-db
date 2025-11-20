import { os } from "@orpc/server";

export const cacheMiddleware = os.middleware(({ next }) => {
  return next();
});
