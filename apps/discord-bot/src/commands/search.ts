import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { match } from "ts-pattern";
import { getMapCommandEmbed } from "./maps";

export const autocomplete = new Autocomplete({
  name: "query",
  commandName: "search",
});

execute(autocomplete, async (interaction) => {
  const query = interaction.options.getString("query") ?? "";

  const result = await api.search.search({ query, limit: 25 });

  return interaction.respond(
    result.hits.map((hit) => {
      return {
        name: hit.name,
        value: hit.id,
      };
    })
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

  const embed = await getSearchCommandEmbed(query);

  if (!embed) {
    return interaction.reply({ content: "No results found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

async function getSearchCommandEmbed(query: string) {
  const topResult = (await api.search.search({ query, limit: 1 })).hits[0];

  return match(topResult)
    .with({ kind: "maps" }, (map) => {
      return getMapCommandEmbed(map.id);
    })
    .otherwise(() => {
      return new EmbedBuilder().setDescription(
        `No results found for **${query}**`
      );
    });
}
