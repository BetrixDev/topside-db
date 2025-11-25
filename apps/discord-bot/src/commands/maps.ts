import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Autocomplete, execute, Slash } from "sunar";
import { api } from "../api";
import { createTopsideDbUrl } from "@topside-db/utils";

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

  const embed = await getMapCommandEmbed(mapId);

  if (!embed) {
    return interaction.reply({ content: "Map not found" });
  }

  interaction.reply({
    embeds: [embed],
  });
});

export async function getMapCommandEmbed(mapId: string) {
  const map = await api.maps.getMap({ id: mapId });

  if (!map) {
    return null;
  }

  return new EmbedBuilder()
    .setTitle(map.name)
    .setDescription(map.description)
    .addFields({
      name: "Difficulty",
      value:
        map.difficulties
          ?.map((d) => `**${d.name}**: ${Math.round(d.rating * 5)}/5`)
          .join("\n") ?? "N/A",
      inline: true,
    })
    .addFields({
      name: "Maximum Time",
      value: map.formattedMaxTime ?? "N/A",
      inline: true,
    })
    .setImage(map.imageUrl)
    .setURL(createTopsideDbUrl({ type: "map", id: map.id }))
    .setColor("#1692df");
}
