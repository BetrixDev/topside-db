import { z } from "zod";
import { localizedStringSchema } from "./common";

// Schema for hideout level requirement item
const hideoutLevelRequirementSchema = z.object({
  itemId: z.string(),
  quantity: z.number(),
});

// Schema for hideout level
const hideoutLevelSchema = z.object({
  level: z.number(),
  requirementItemIds: z.array(hideoutLevelRequirementSchema),
});

// Main hideout schema
export const hideoutSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  maxLevel: z.number(),
  levels: z.array(hideoutLevelSchema),
});

export type Hideout = z.infer<typeof hideoutSchema>;
export type HideoutLevel = z.infer<typeof hideoutLevelSchema>;
export type HideoutLevelRequirement = z.infer<
  typeof hideoutLevelRequirementSchema
>;
