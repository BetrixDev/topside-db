import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { createTopsideDbUrl, PRIMARY_COLOR } from "@topside-db/utils";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "items",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.searchByCategory({
    query,
    category: "items",
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
  name: "items",
  description: "Search for items in Arc Raiders",
  options: [
    {
      name: "query",
      description: "Item name to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const itemId = interaction.options.getString("query") ?? "";

  const embed = await getItemCommandEmbed(itemId);

  if (!embed) {
    return interaction.reply({ content: "Item not found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

export async function getItemCommandEmbed(itemId: string) {
  const item = await api.items.getItem({ id: itemId });

  if (!item) {
    return null;
  }

  await api.analytics.trackView({ resourceType: "item", resourceId: item.id });

  const embed = new EmbedBuilder()
    .setTitle(item.name)
    .setDescription(item.description ?? "No description available")
    .setURL(createTopsideDbUrl({ type: "item", id: item.id }))
    .setColor(PRIMARY_COLOR);

  // Add item image if available
  if (item.imageFilename) {
    embed.setThumbnail(item.imageFilename);
  }

  // Basic info fields
  const basicInfo: string[] = [];
  if (item.type) basicInfo.push(`**Type:** ${item.type}`);
  if (item.rarity) basicInfo.push(`**Rarity:** ${item.rarity}`);
  if (item.stackSize != null)
    basicInfo.push(`**Stack Size:** ${item.stackSize}`);
  if (item.weightKg != null) basicInfo.push(`**Weight:** ${item.weightKg} kg`);
  if (item.value != null)
    basicInfo.push(`**Value:** ${item.value.toLocaleString()} credits`);

  if (basicInfo.length > 0) {
    embed.addFields({
      name: "📦 Item Info",
      value: basicInfo.join("\n"),
      inline: true,
    });
  }

  // Effects
  if (item.effects && item.effects.length > 0) {
    const effectsText = item.effects
      .map((effect) => `• ${effect.name}: ${effect.value}`)
      .join("\n");
    embed.addFields({
      name: "✨ Effects",
      value: effectsText.slice(0, 1024),
      inline: true,
    });
  }

  // Crafting recipe
  if (item.recipes && item.recipes.length > 0) {
    const recipeText = item.recipes
      .map((r) => `• ${r.quantity}x ${r.material?.name ?? r.materialId}`)
      .join("\n");
    embed.addFields({
      name: "🔨 Crafting Materials",
      value: recipeText.slice(0, 1024),
      inline: false,
    });
  }

  // Recycles into
  if (item.recycles && item.recycles.length > 0) {
    const recycleText = item.recycles
      .map((r) => `• ${r.quantity}x ${r.material?.name ?? r.materialId}`)
      .join("\n");

    let recycleHeader = "♻️ Recycles Into";
    if (item.recycledValue != null && item.value != null) {
      const worthIt = item.recycledValue > item.value;
      recycleHeader += worthIt ? " ✅" : " ⚠️";
    }

    embed.addFields({
      name: recycleHeader,
      value: recycleText.slice(0, 1024),
      inline: true,
    });
  }

  // Salvages into
  if (item.salvages && item.salvages.length > 0) {
    const salvageText = item.salvages
      .map((s) => `• ${s.quantity}x ${s.material?.name ?? s.materialId}`)
      .join("\n");
    embed.addFields({
      name: "✂️ Salvages Into",
      value: salvageText.slice(0, 1024),
      inline: true,
    });
  }

  // Traders selling this item
  if (item.traders && item.traders.length > 0) {
    const traderText = item.traders
      .slice(0, 5)
      .map((t) => `• ${t.trader?.name ?? t.traderId}`)
      .join("\n");
    embed.addFields({
      name: "🛒 Available From",
      value:
        item.traders.length > 5
          ? `${traderText}\n...and ${item.traders.length - 5} more`
          : traderText,
      inline: true,
    });
  }

  return embed;
}
