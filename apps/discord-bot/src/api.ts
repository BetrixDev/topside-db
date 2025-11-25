import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@topside-db/api/routers/index";

export const api: AppRouterClient = createORPCClient(
  new RPCLink({
    url: process.env.API_URL!,
    headers: () => ({
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    }),
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  })
);
