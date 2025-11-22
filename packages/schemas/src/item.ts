import { z } from "zod";
import { localizedStringSchema } from "./common";

// Schema for effect with localized name and value
const effectSchema = localizedStringSchema.extend({
  value: z.string(),
});

// Schema for material quantities (recipes, recycles, salvages)
const materialsSchema = z.record(z.string(), z.number());

// Main item schema
export const itemSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  type: z.string(),
  value: z.number(),
  rarity: z.string(),
  recyclesInto: materialsSchema.optional(),
  weightKg: z.number(),
  stackSize: z.number(),
  effects: z.record(z.string(), effectSchema).optional(),
  imageFilename: z.string(),
  updatedAt: z.string(),
  recipe: materialsSchema.optional(),
  craftBench: z.string().optional(),
  salvagesInto: materialsSchema.optional(),
});

export type Item = z.infer<typeof itemSchema>;
