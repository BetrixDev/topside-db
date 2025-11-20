import { z } from "zod";

// Schema for localized strings (name, description, etc.)
const localizedStringSchema = z.object({
  en: z.string(),
  de: z.string().optional(),
  fr: z.string().optional(),
  es: z.string().optional(),
  pt: z.string().optional(),
  pl: z.string().optional(),
  no: z.string().optional(),
  da: z.string().optional(),
  it: z.string().optional(),
  ru: z.string().optional(),
  ja: z.string().optional(),
  "zh-TW": z.string().optional(),
  uk: z.string().optional(),
  "zh-CN": z.string().optional(),
  kr: z.string().optional(),
  tr: z.string().optional(),
  hr: z.string().optional(),
  sr: z.string().optional(),
});

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
