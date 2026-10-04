import { loadConfig } from "./config";
import { createPool } from "./db/pool";
import { migrate } from "./db/migrate";
import { buildApp } from "./app";

const config = loadConfig();
const db = createPool(config.databaseUrl);
await migrate(db);

const app = await buildApp({ config, db });
await app.listen({ port: config.port, host: config.host });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await db.end();
    process.exit(0);
  });
}
