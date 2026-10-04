import { createPool } from "../src/db/pool";
import { migrate } from "../src/db/migrate";
import { loadConfig } from "../src/config";

// Se ejecuta una vez antes de todas las pruebas: aplica el esquema en la base de pruebas.
export default async function setup() {
  loadConfig({ databaseUrl: "unused", jwtSecret: "unused" }); // carga apps/api/.env si existe
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/grupo_estudio_test";
  const db = createPool(url);
  try {
    await migrate(db);
  } catch (error) {
    throw new Error(
      `No se pudo conectar a la base de pruebas (${url}). ¿Está corriendo "docker compose up -d db"?\n${String(error)}`,
    );
  } finally {
    await db.end();
  }
}
