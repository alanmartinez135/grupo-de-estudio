// pnpm --filter api db:seed — crea la cuenta de administrador de desarrollo.
// El registro público siempre crea estudiantes; el rol admin solo se asigna desde aquí
// (o, más adelante, desde la gestión de usuarios por otro administrador).
import { loadConfig } from "../config";
import { createPool } from "../db/pool";
import { migrate } from "../db/migrate";
import { hashPassword } from "../auth/password";
import { findByCorreo, insertUser } from "../users/repository";

const correo = (process.env.SEED_ADMIN_CORREO ?? "").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "";
if (!correo || password.length < 8) {
  console.error("Define SEED_ADMIN_CORREO y SEED_ADMIN_PASSWORD (mínimo 8 caracteres) en apps/api/.env");
  process.exit(1);
}

const db = createPool(loadConfig().databaseUrl);
try {
  await migrate(db);
  if (await findByCorreo(db, correo)) {
    console.log(`La cuenta ${correo} ya existe; no se modificó.`);
  } else {
    await insertUser(db, {
      correo,
      passwordHash: await hashPassword(password),
      name: "Administración",
      career: "Coordinación académica",
      jornada: "diurna",
      englishLevel: "C1",
      role: "admin",
    });
    console.log(`Administrador ${correo} creado.`);
  }
} finally {
  await db.end();
}
