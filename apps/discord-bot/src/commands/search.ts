import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "search",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.search({ query });

  return interaction.respond(
    result.hits
      .map((hit) => {
        return {
          name: hit.name,
          value: hit.id,
        };
      })
      .slice(0, 24)
  );
});

export const slash = new Slash({
  name: "search",
  description: "Search for anything related to Arc Raiders",
  options: [
    {
      name: "query",
      description: "Search query",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  interaction.reply({
    embeds: [new EmbedBuilder().setDescription(query)],
  });
});
