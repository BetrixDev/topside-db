import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";

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

  return new EmbedBuilder().setDescription(`Trader: ${trader.name}`);
}
