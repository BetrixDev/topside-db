import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { createTopsideDbUrl, PRIMARY_COLOR } from "@topside-db/utils";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "traders",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.searchByCategory({
    query,
    category: "traders",
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
  name: "traders",
  description: "Search for traders in Arc Raiders",
  options: [
    {
      name: "query",
      description: "Trader name to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const traderId = interaction.options.getString("query") ?? "";

  const embed = await getTraderCommandEmbed(traderId);

  if (!embed) {
    return interaction.reply({ content: "Trader not found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

export async function getTraderCommandEmbed(traderId: string) {
  const trader = await api.traders.getTrader({ id: traderId });

  if (!trader) {
    return null;
  }

  await api.analytics.trackView({ resourceType: "trader", resourceId: trader.id });

  const embed = new EmbedBuilder()
    .setTitle(trader.name)
    .setDescription(trader.description ?? "No description available")
    .setURL(createTopsideDbUrl({ type: "trader", id: trader.id }))
    .setColor(PRIMARY_COLOR);

  // Add trader image if available
  if (trader.imageUrl) {
    embed.setThumbnail(trader.imageUrl);
  }

  // Stats
  const stats = trader.stats;
  if (stats) {
    const statsText: string[] = [];
    statsText.push(`**Items for Sale:** ${stats.totalItemsForSale}`);
    statsText.push(`**Quests:** ${stats.totalQuests}`);
    statsText.push(`**Categories:** ${stats.uniqueCategories}`);
    
    embed.addFields({
      name: "📊 Overview",
      value: statsText.join("\n"),
      inline: true,
    });
  }

  // Sell categories
  if (trader.sellCategories && trader.sellCategories.length > 0) {
    const categoriesText = trader.sellCategories
      .map((cat) => `• ${cat}`)
      .join("\n");
    embed.addFields({
      name: "🏷️ Categories",
      value: categoriesText.slice(0, 1024),
      inline: true,
    });
  }

  // Quests
  if (trader.quests && trader.quests.length > 0) {
    const questsText = trader.quests
      .slice(0, 5)
      .map((q) => `• ${q.name}`)
      .join("\n");
    
    embed.addFields({
      name: "📜 Quests",
      value: trader.quests.length > 5
        ? `${questsText}\n...and ${trader.quests.length - 5} more`
        : questsText,
      inline: false,
    });
  }

  // Items by currency
  const itemsByCurrency = trader.itemsByCurrency;
  if (itemsByCurrency) {
    const currencyInfo: string[] = [];
    
    if (itemsByCurrency.credits.length > 0) {
      currencyInfo.push(`💰 **Credits:** ${itemsByCurrency.credits.length} items`);
    }
    if (itemsByCurrency.seeds.length > 0) {
      currencyInfo.push(`🌱 **Seeds:** ${itemsByCurrency.seeds.length} items`);
    }
    if (itemsByCurrency.augment.length > 0) {
      currencyInfo.push(`✨ **Augment:** ${itemsByCurrency.augment.length} items`);
    }
    
    if (currencyInfo.length > 0) {
      embed.addFields({
        name: "🛒 Items for Sale",
        value: currencyInfo.join("\n"),
        inline: false,
      });
    }
  }

  return embed;
}
