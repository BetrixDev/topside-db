import type { Context as HonoContext } from "hono";
import { db } from "@topside-db/db";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	// No auth configured
	return {
		session: null,
		db,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
