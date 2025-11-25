type TopsideDbUrlOptions = {
  type: "map";
  id: string;
};

export function createTopsideDbUrl(options: TopsideDbUrlOptions) {
  if (options.type === "map") {
    return `https://topside-db.com/map/${options.id}`;
  }

  throw new Error(`Invalid options: ${JSON.stringify(options)}`);
}
