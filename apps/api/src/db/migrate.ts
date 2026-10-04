import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Db } from "./pool";

const schemaPath = fileURLToPath(new URL("../../db/schema.sql", import.meta.url));

// Aplica db/schema.sql. Es seguro ejecutarlo varias veces.
export async function migrate(db: Db): Promise<void> {
  const sql = readFileSync(schemaPath, "utf8");
  await db.query(sql);
}
