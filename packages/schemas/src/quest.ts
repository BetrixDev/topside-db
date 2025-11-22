import { z } from "zod";
import { localizedStringSchema } from "./common";

// Schema for quest reward item
const questRewardItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number(),
});

// Main quest schema
export const questSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  name: localizedStringSchema,
  trader: z.string(),
  description: localizedStringSchema.optional(),
  objectives: z.array(localizedStringSchema),
  rewardItemIds: z.array(questRewardItemSchema),
  xp: z.number(),
  previousQuestIds: z.array(z.string()),
  nextQuestIds: z.array(z.string()),
});

export type Quest = z.infer<typeof questSchema>;
export type QuestRewardItem = z.infer<typeof questRewardItemSchema>;
