import z from "zod";
import { publicProcedure } from "..";
import { eq, Tables, inArray } from "@topside-db/db";
import { cacheMiddleware } from "../middleware/cache";

export const questsRouter = {
  getQuest: publicProcedure
    .use(cacheMiddleware({ keyPrefix: "quests" }))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const quest = await context.db.query.quests.findFirst({
        where: eq(Tables.quests.id, input.id),
        with: {
          objectives: {
            orderBy: (objectives, { asc }) => [asc(objectives.orderIndex)],
          },
          rewardItems: true,
          prerequisites: true,
          nextQuests: true,
        },
      });

      if (!quest) {
        return null;
      }

      // Fetch item details for reward items
      const rewardItemIds = quest.rewardItems.map((r) => r.itemId);
      const rewardItems =
        rewardItemIds.length > 0
          ? await context.db.query.items.findMany({
              where: inArray(Tables.items.id, rewardItemIds),
              columns: {
                id: true,
                name: true,
                imageFilename: true,
                rarity: true,
                value: true,
              },
            })
          : [];

      const itemMap = new Map(rewardItems.map((i) => [i.id, i]));

      // Fetch prerequisite quest names
      const prerequisiteQuestIds = quest.prerequisites.map(
        (p) => p.prerequisiteQuestId
      );
      const prerequisiteQuests =
        prerequisiteQuestIds.length > 0
          ? await context.db.query.quests.findMany({
              where: inArray(Tables.quests.id, prerequisiteQuestIds),
              columns: {
                id: true,
                name: true,
                trader: true,
              },
            })
          : [];

      const prerequisiteMap = new Map(prerequisiteQuests.map((q) => [q.id, q]));

      // Fetch next quest names
      const nextQuestIds = quest.nextQuests.map((n) => n.nextQuestId);
      const nextQuestsData =
        nextQuestIds.length > 0
          ? await context.db.query.quests.findMany({
              where: inArray(Tables.quests.id, nextQuestIds),
              columns: {
                id: true,
                name: true,
                trader: true,
              },
            })
          : [];

      const nextQuestMap = new Map(nextQuestsData.map((q) => [q.id, q]));

      // Calculate total reward value
      const totalRewardValue = quest.rewardItems.reduce((total, r) => {
        const item = itemMap.get(r.itemId);
        return total + (item?.value || 0) * r.quantity;
      }, 0);

      return {
        ...quest,
        totalRewardValue,
        rewardItems: quest.rewardItems.map((r) => ({
          ...r,
          item: itemMap.get(r.itemId),
        })),
        prerequisites: quest.prerequisites.map((p) => ({
          ...p,
          quest: prerequisiteMap.get(p.prerequisiteQuestId),
        })),
        nextQuests: quest.nextQuests.map((n) => ({
          ...n,
          quest: nextQuestMap.get(n.nextQuestId),
        })),
      };
    }),
};
