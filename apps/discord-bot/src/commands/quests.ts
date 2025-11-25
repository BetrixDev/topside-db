import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";

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

  interaction.reply({
    embeds: [new EmbedBuilder().setDescription(`Quest: ${questId}`)],
  });
});

