import { loadConfig } from "../src/config";
import { createPool, type Db } from "../src/db/pool";
import { buildApp } from "../src/app";

// Base aparte para pruebas (la crea apps/api/db/init/01-test-db.sql al levantar Docker).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/grupo_estudio_test";

export async function createTestApp(overrides: Parameters<typeof loadConfig>[0] = {}) {
  const config = loadConfig({
    databaseUrl: TEST_DATABASE_URL,
    jwtSecret: "secreto-solo-para-pruebas",
    logger: false,
    ...overrides,
  });
  const db = createPool(config.databaseUrl);
  const app = await buildApp({ config, db });
  return { app, db };
}

export async function resetDb(db: Db) {
  await db.query("TRUNCATE grupo_integrantes, grupos, usuarios RESTART IDENTITY CASCADE");
}

export function nuevoEstudiante(overrides: Record<string, unknown> = {}) {
  return {
    correo: "camila.rojas@duocuc.cl",
    password: "clave-segura-123",
    name: "Camila Rojas",
    career: "Ingeniería en Informática",
    jornada: "diurna",
    englishLevel: "B1",
    ...overrides,
  };
}
