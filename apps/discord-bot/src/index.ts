import "dotenv/config";

import { Client, load } from "sunar";

const client = new Client({
  intents: [],
});

await load(`src/{commands,signals}/**/*.{js,ts}`);

client.login(process.env.DISCORD_TOKEN);
