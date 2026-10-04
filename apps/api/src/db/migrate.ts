import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Db } from "./pool";
import { seedContent } from "./seedContent";

const schemaPath = fileURLToPath(new URL("../../db/schema.sql", import.meta.url));

// Aplica db/schema.sql y carga el contenido inicial de evaluaciones. Es seguro ejecutarlo varias veces.
export async function migrate(db: Db): Promise<void> {
  const sql = readFileSync(schemaPath, "utf8");
  await db.query(sql);
  await seedContent(db);
}
