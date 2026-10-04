import type { EnglishLevel, Jornada, Role, User } from "@grupo-estudio/types";
import type { Db } from "../db/pool";

interface UserRow {
  id: string;
  correo: string;
  password_hash: string;
  nombre: string;
  carrera: string;
  jornada: Jornada;
  nivel_ingles: EnglishLevel;
  rol: Role;
}

export interface UserWithHash extends User {
  passwordHash: string;
}

// La base usa nombres en español; el API usa los mismos campos que la app.
function toUser(row: UserRow): UserWithHash {
  return {
    id: row.id,
    correo: row.correo,
    name: row.nombre,
    career: row.carrera,
    jornada: row.jornada,
    englishLevel: row.nivel_ingles,
    role: row.rol,
    passwordHash: row.password_hash,
  };
}

export function publicUser({ passwordHash: _omit, ...user }: UserWithHash): User {
  return user;
}

const COLUMNS = "id, correo, password_hash, nombre, carrera, jornada, nivel_ingles, rol";

export async function findByCorreo(db: Db, correo: string): Promise<UserWithHash | null> {
  const { rows } = await db.query<UserRow>(`SELECT ${COLUMNS} FROM usuarios WHERE correo = $1`, [correo]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function findById(db: Db, id: string): Promise<UserWithHash | null> {
  const { rows } = await db.query<UserRow>(`SELECT ${COLUMNS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function insertUser(
  db: Db,
  data: Omit<User, "id" | "role"> & { passwordHash: string; role?: Role },
): Promise<UserWithHash> {
  const { rows } = await db.query<UserRow>(
    `INSERT INTO usuarios (correo, password_hash, nombre, carrera, jornada, nivel_ingles, rol)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUMNS}`,
    [data.correo, data.passwordHash, data.name, data.career, data.jornada, data.englishLevel, data.role ?? "student"],
  );
  return toUser(rows[0]!);
}
