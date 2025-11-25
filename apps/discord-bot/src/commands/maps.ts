import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "maps",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.searchByCategory({
    query,
    category: "maps",
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
  name: "maps",
  description: "Search for maps in Arc Raiders",
  options: [
    {
      name: "query",
      description: "Map name to search for",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
});

execute(slash, async (interaction) => {
  const mapId = interaction.options.getString("query") ?? "";

  interaction.reply({
    embeds: [new EmbedBuilder().setDescription(`Map: ${mapId}`)],
  });
});

