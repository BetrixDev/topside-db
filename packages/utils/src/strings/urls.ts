type TopsideDbUrlOptions = {
  type: "map" | "item" | "arc" | "quest" | "trader";
  id: string;
};

export function createTopsideDbUrl(options: TopsideDbUrlOptions) {
  const baseUrl = "https://topside-db.com";
  
  switch (options.type) {
    case "map":
      return `${baseUrl}/maps/${options.id}`;
    case "item":
      return `${baseUrl}/items/${options.id}`;
    case "arc":
      return `${baseUrl}/arcs/${options.id}`;
    case "quest":
      return `${baseUrl}/quests/${options.id}`;
    case "trader":
      return `${baseUrl}/traders/${options.id}`;
    default:
      throw new Error(`Invalid options: ${JSON.stringify(options)}`);
  }
}
