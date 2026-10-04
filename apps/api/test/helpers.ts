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

let contador = 0;

// Crea un estudiante directo en la base (sin pasar por Argon2) y le firma un token de acceso.
// Sirve para pruebas que necesitan muchos usuarios, como la de concurrencia.
export async function crearEstudiante(app: import("fastify").FastifyInstance, db: Db, nombre = "Estudiante") {
  contador += 1;
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO usuarios (correo, password_hash, nombre, carrera, jornada, nivel_ingles)
     VALUES ($1, 'hash-de-prueba', $2, 'Ingeniería en Informática', 'diurna', 'B1') RETURNING id`,
    [`estudiante${contador}.${Date.now()}@duocuc.cl`, `${nombre} ${contador}`],
  );
  const id = rows[0]!.id;
  const token = app.jwt.sign({ sub: id, role: "student", type: "access" }, { expiresIn: "15m" });
  return { id, headers: { authorization: `Bearer ${token}` } };
}
