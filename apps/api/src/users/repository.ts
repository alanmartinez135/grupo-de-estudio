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

export async function deleteUser(db: Db, id: string): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Las membresías, resultados y asistencias se borran en cascada.
    await client.query("DELETE FROM usuarios WHERE id = $1", [id]);
    // Igual que al abandonar un grupo: si quedó sin integrantes, se elimina.
    await client.query(
      "DELETE FROM grupos g WHERE NOT EXISTS (SELECT 1 FROM grupo_integrantes gi WHERE gi.grupo_id = g.id)",
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRole(db: Db, id: string, role: Role): Promise<UserWithHash | null> {
  const { rows } = await db.query<UserRow>(`UPDATE usuarios SET rol = $2 WHERE id = $1 RETURNING ${COLUMNS}`, [id, role]);
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
