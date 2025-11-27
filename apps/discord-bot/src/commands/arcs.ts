import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { createTopsideDbUrl, PRIMARY_COLOR } from "@topside-db/utils";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "arcs",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.searchByCategory({
    query,
    category: "arcs",
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
  name: "arcs",
  description: "Search for ARCs in Arc Raiders",
  options: [
    {
      name: "query",
      description: "ARC name to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const arcId = interaction.options.getString("query") ?? "";

  const embed = await getArcCommandEmbed(arcId);

  if (!embed) {
    return interaction.reply({ content: "ARC not found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

// Get threat level color for embed
function getThreatLevelColor(threatLevel: string | null | undefined): number {
  if (!threatLevel) return parseInt(PRIMARY_COLOR.replace("#", ""), 16);
  const level = threatLevel.toLowerCase();
  if (level.includes("extreme") || level.includes("very high")) return 0xef4444; // red
  if (level.includes("high")) return 0xf97316; // orange
  if (level.includes("medium") || level.includes("moderate")) return 0xeab308; // yellow
  if (level.includes("low")) return 0x10b981; // emerald
  return parseInt(PRIMARY_COLOR.replace("#", ""), 16);
}

export async function getArcCommandEmbed(arcId: string) {
  const arc = await api.arcs.getArc({ id: arcId });

  if (!arc) {
    return null;
  }

  await api.analytics.trackView({ resourceType: "arc", resourceId: arc.id });

  const embed = new EmbedBuilder()
    .setTitle(arc.name)
    .setDescription(arc.description ?? "No description available")
    .setURL(createTopsideDbUrl({ type: "arc", id: arc.id }))
    .setColor(getThreatLevelColor(arc.threatLevel));

  // Add arc image if available
  if (arc.imageUrl) {
    embed.setThumbnail(arc.imageUrl);
  }

  // Stats info
  const statsInfo: string[] = [];
  if (arc.threatLevel) statsInfo.push(`**Threat Level:** ${arc.threatLevel}`);
  if (arc.health != null) statsInfo.push(`**Health:** ${arc.health.toLocaleString()}`);
  if (arc.armorPlating) statsInfo.push(`**Armor:** ${arc.armorPlating}`);
  
  if (statsInfo.length > 0) {
    embed.addFields({
      name: "💀 Combat Stats",
      value: statsInfo.join("\n"),
      inline: true,
    });
  }

  // Quick stats
  const quickStats: string[] = [];
  if (arc.stats) {
    quickStats.push(`**Attacks:** ${arc.stats.totalAttacks}`);
    quickStats.push(`**Weaknesses:** ${arc.stats.totalWeaknesses}`);
    quickStats.push(`**Loot Items:** ${arc.stats.totalLoot}`);
  }
  if (arc.totalLootValue != null && arc.totalLootValue > 0) {
    quickStats.push(`**Loot Value:** ${arc.totalLootValue.toLocaleString()} cr`);
  }
  
  if (quickStats.length > 0) {
    embed.addFields({
      name: "📊 Overview",
      value: quickStats.join("\n"),
      inline: true,
    });
  }

  // Weaknesses
  if (arc.weaknesses && arc.weaknesses.length > 0) {
    const weaknessText = arc.weaknesses.map((w) => `• ${w}`).join("\n");
    embed.addFields({
      name: "🎯 Weaknesses",
      value: weaknessText.slice(0, 1024),
      inline: false,
    });
  }

  // Attack patterns (grouped by type)
  if (arc.attacksByType && Object.keys(arc.attacksByType).length > 0) {
    const attackTypes = Object.keys(arc.attacksByType);
    const attackText = attackTypes
      .slice(0, 3)
      .map((type) => {
        const attacks = arc.attacksByType![type];
        return `**${type}** (${attacks.length})`;
      })
      .join(" • ");
    
    embed.addFields({
      name: "⚔️ Attack Types",
      value: attackText || "Unknown",
      inline: false,
    });
  }

  // Loot items (show first few with item names)
  if (arc.lootDetails && arc.lootDetails.length > 0) {
    const lootWithItems = arc.lootDetails.filter((l) => l.item !== null);
    const lootText = lootWithItems.length > 0
      ? lootWithItems
          .slice(0, 6)
          .map((l) => `• ${l.item!.name}`)
          .join("\n")
      : arc.lootDetails
          .slice(0, 6)
          .map((l) => `• ${l.name}`)
          .join("\n");

    const moreCount = arc.lootDetails.length > 6 ? arc.lootDetails.length - 6 : 0;
    
    embed.addFields({
      name: "📦 Potential Loot",
      value: moreCount > 0 
        ? `${lootText}\n...and ${moreCount} more`
        : lootText,
      inline: false,
    });
  }

  return embed;
}

