import { z } from "zod";
import { localizedStringSchema } from "./common";

// Schema for material quantities (recipes, recycles, salvages)
const materialsSchema = z.record(z.string(), z.number());

// Main item schema
export const itemSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  type: z.string(),
  value: z.number().optional(),
  rarity: z.string(),
  recyclesInto: materialsSchema.optional(),
  weightKg: z.number().optional(),
  stackSize: z.number().optional(),
  effects: z.record(z.string(), localizedStringSchema.nullable()).optional(),
  imageFilename: z.string().optional(),
  updatedAt: z.string(),
  recipe: materialsSchema.optional(),
  craftBench: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  salvagesInto: materialsSchema.optional(),
});

export type Item = z.infer<typeof itemSchema>;
