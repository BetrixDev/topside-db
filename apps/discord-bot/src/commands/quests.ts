import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { createTopsideDbUrl, PRIMARY_COLOR } from "@topside-db/utils";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "quests",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.searchByCategory({
    query,
    category: "quests",
    limit: 25,
  });

  return interaction.respond(
    result.hits.map((hit) => ({
      name: hit.name,
      value: hit.id,
    }))
  );
});

export const slash = new Slash({
  name: "quests",
  description: "Search for quests in Arc Raiders",
  options: [
    {
      name: "query",
      description: "Quest name to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const questId = interaction.options.getString("query") ?? "";

  const embed = await getQuestCommandEmbed(questId);

  if (!embed) {
    return interaction.reply({ content: "Quest not found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

export async function getQuestCommandEmbed(questId: string) {
  const quest = await api.quests.getQuest({ id: questId });

  if (!quest) {
    return null;
  }

  await api.analytics.trackView({ resourceType: "quest", resourceId: quest.id });

  const embed = new EmbedBuilder()
    .setTitle(quest.name)
    .setDescription(quest.description ?? "No description available")
    .setURL(createTopsideDbUrl({ type: "quest", id: quest.id }))
    .setColor(PRIMARY_COLOR);

  // Quest info
  const questInfo: string[] = [];
  if (quest.trader) questInfo.push(`**Trader:** ${quest.trader}`);
  if (quest.xp != null) questInfo.push(`**XP Reward:** ${quest.xp.toLocaleString()}`);
  if (quest.totalRewardValue != null && quest.totalRewardValue > 0) {
    questInfo.push(`**Reward Value:** ${quest.totalRewardValue.toLocaleString()} credits`);
  }
  
  if (questInfo.length > 0) {
    embed.addFields({
      name: "📋 Quest Info",
      value: questInfo.join("\n"),
      inline: true,
    });
  }

  // Objectives
  if (quest.objectives && quest.objectives.length > 0) {
    const objectivesText = quest.objectives
      .map((obj, i) => `${i + 1}. ${obj.text}`)
      .join("\n");
    embed.addFields({
      name: "🎯 Objectives",
      value: objectivesText.slice(0, 1024),
      inline: false,
    });
  }

  // Reward items
  if (quest.rewardItems && quest.rewardItems.length > 0) {
    const rewardsText = quest.rewardItems
      .map((r) => `• ${r.quantity}x ${r.item?.name ?? r.itemId}`)
      .join("\n");
    embed.addFields({
      name: "🎁 Item Rewards",
      value: rewardsText.slice(0, 1024),
      inline: true,
    });
  }

  // Prerequisites
  if (quest.prerequisites && quest.prerequisites.length > 0) {
    const prereqText = quest.prerequisites
      .map((p) => `• ${p.quest?.name ?? p.prerequisiteQuestId}`)
      .join("\n");
    embed.addFields({
      name: "🔒 Prerequisites",
      value: prereqText.slice(0, 1024),
      inline: true,
    });
  }

  // Next quests (unlocks)
  if (quest.nextQuests && quest.nextQuests.length > 0) {
    const nextText = quest.nextQuests
      .map((n) => `• ${n.quest?.name ?? n.nextQuestId}`)
      .join("\n");
    embed.addFields({
      name: "🔓 Unlocks",
      value: nextText.slice(0, 1024),
      inline: true,
    });
  }

  return embed;
}

