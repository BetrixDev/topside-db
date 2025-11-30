import { onError, ORPCError, os, ValidationError } from "@orpc/server";
import type { Context } from "./context";
import z from "zod";

export const o = os.$context<Context>().use(
  onError((error) => {
    if (
      error instanceof ORPCError &&
      error.code === "BAD_REQUEST" &&
      error.cause instanceof ValidationError
    ) {
      const zodError = new z.ZodError(error.cause.issues as z.core.$ZodIssue[]);

      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        status: 422,
        message: z.prettifyError(zodError),
        data: z.flattenError(zodError),
        cause: error.cause,
      });
    }

    if (
      error instanceof ORPCError &&
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.cause instanceof ValidationError
    ) {
      throw new ORPCError("OUTPUT_VALIDATION_FAILED", {
        cause: error.cause,
      });
    }
  })
);

export const publicProcedure = o;
