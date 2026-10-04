// pnpm --filter api db:migrate — aplica db/schema.sql a la base de DATABASE_URL.
import { loadConfig } from "../config";
import { createPool } from "../db/pool";
import { migrate } from "../db/migrate";

const db = createPool(loadConfig().databaseUrl);
try {
  await migrate(db);
  console.log("Esquema aplicado.");
} finally {
  await db.end();
}
