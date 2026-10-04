import type pg from "pg";
import {
  MAX_GROUP_MEMBERS,
  type CreateGroupInput,
  type EnglishLevel,
  type GroupMember,
  type GroupWithMembers,
} from "@grupo-estudio/types";
import { type Db, isUniqueViolation } from "../db/pool";
import { AppError } from "../errors";

type Queryable = Db | pg.PoolClient;

export const grupoNoExiste = () => new AppError(404, "GRUPO_NO_EXISTE", "El grupo no existe.");

interface GroupRow {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  nivel: EnglishLevel;
  creado_por: string | null;
  integrantes: GroupMember[];
}

// Grupos con sus integrantes (solo nombre y carrera) en una sola consulta.
const SELECT_GROUPS = `
  SELECT g.id, g.nombre, g.descripcion, g.codigo, g.nivel, g.creado_por,
         COALESCE(
           json_agg(json_build_object('id', u.id, 'name', u.nombre, 'career', u.carrera) ORDER BY gi.unido_en)
             FILTER (WHERE u.id IS NOT NULL),
           '[]'
         ) AS integrantes
    FROM grupos g
    LEFT JOIN grupo_integrantes gi ON gi.grupo_id = g.id
    LEFT JOIN usuarios u ON u.id = gi.usuario_id`;

function toGroup(row: GroupRow): GroupWithMembers {
  return {
    id: row.id,
    name: row.nombre,
    description: row.descripcion,
    code: row.codigo,
    level: row.nivel,
    createdBy: row.creado_por,
    members: row.integrantes,
    memberIds: row.integrantes.map((m) => m.id),
  };
}

export async function listGroups(db: Queryable): Promise<GroupWithMembers[]> {
  const { rows } = await db.query<GroupRow>(`${SELECT_GROUPS} GROUP BY g.id ORDER BY g.creado_en DESC`);
  return rows.map(toGroup);
}

export async function findGroup(db: Queryable, id: string): Promise<GroupWithMembers | null> {
  const { rows } = await db.query<GroupRow>(`${SELECT_GROUPS} WHERE g.id = $1 GROUP BY g.id`, [id]);
  return rows[0] ? toGroup(rows[0]) : null;
}

export async function findGroupIdByCode(db: Queryable, code: string): Promise<string | null> {
  const { rows } = await db.query<{ id: string }>("SELECT id FROM grupos WHERE codigo = $1", [code]);
  return rows[0]?.id ?? null;
}

// Ejecuta fn dentro de una transacción: si algo falla, se deshace todo.
async function withTransaction<T>(db: Db, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function randomCode(): string {
  return `DUOC-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Crea el grupo con un código DUOC-#### único y deja a quien lo crea como primer integrante.
export function createGroup(db: Db, userId: string, input: Required<CreateGroupInput>): Promise<GroupWithMembers> {
  return withTransaction(db, async (client) => {
    let groupId: string | undefined;
    for (let attempt = 0; attempt < 10 && !groupId; attempt++) {
      // El savepoint permite reintentar con otro código si el generado ya existe.
      await client.query("SAVEPOINT codigo");
      try {
        const { rows } = await client.query<{ id: string }>(
          `INSERT INTO grupos (nombre, descripcion, codigo, nivel, creado_por)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [input.name, input.description, randomCode(), input.level, userId],
        );
        groupId = rows[0]!.id;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        await client.query("ROLLBACK TO SAVEPOINT codigo");
      }
    }
    if (!groupId) throw new AppError(503, "SIN_CODIGOS", "No se pudo generar un código de grupo. Inténtalo de nuevo.");
    await client.query("INSERT INTO grupo_integrantes (grupo_id, usuario_id) VALUES ($1, $2)", [groupId, userId]);
    return (await findGroup(client, groupId))!;
  });
}

// Unirse a un grupo (H3, RNF-B09): la fila del grupo se bloquea con FOR UPDATE antes de
// contar integrantes, así dos solicitudes simultáneas no pueden ocupar el mismo último cupo.
export function joinGroup(db: Db, userId: string, groupId: string): Promise<GroupWithMembers> {
  return withTransaction(db, async (client) => {
    const locked = await client.query("SELECT id FROM grupos WHERE id = $1 FOR UPDATE", [groupId]);
    if (locked.rowCount === 0) throw grupoNoExiste();

    const { rows } = await client.query<{ usuario_id: string }>(
      "SELECT usuario_id FROM grupo_integrantes WHERE grupo_id = $1",
      [groupId],
    );
    if (rows.some((r) => r.usuario_id === userId)) {
      throw new AppError(409, "YA_ES_INTEGRANTE", "Ya perteneces a este grupo.");
    }
    if (rows.length >= MAX_GROUP_MEMBERS) {
      throw new AppError(409, "GRUPO_LLENO", "El grupo está lleno.");
    }

    await client.query("INSERT INTO grupo_integrantes (grupo_id, usuario_id) VALUES ($1, $2)", [groupId, userId]);
    return (await findGroup(client, groupId))!;
  });
}

// Abandonar un grupo. Si queda sin integrantes, el grupo se elimina.
export function leaveGroup(db: Db, userId: string, groupId: string): Promise<{ groupDeleted: boolean }> {
  return withTransaction(db, async (client) => {
    const locked = await client.query("SELECT id FROM grupos WHERE id = $1 FOR UPDATE", [groupId]);
    if (locked.rowCount === 0) throw grupoNoExiste();

    const removed = await client.query(
      "DELETE FROM grupo_integrantes WHERE grupo_id = $1 AND usuario_id = $2",
      [groupId, userId],
    );
    if (removed.rowCount === 0) throw new AppError(409, "NO_ES_INTEGRANTE", "No perteneces a este grupo.");

    const { rows } = await client.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM grupo_integrantes WHERE grupo_id = $1",
      [groupId],
    );
    if (rows[0]!.n === 0) {
      await client.query("DELETE FROM grupos WHERE id = $1", [groupId]);
      return { groupDeleted: true };
    }
    return { groupDeleted: false };
  });
}
