import type { AdminEvaluation, CreateWeeklyTestInput } from "@grupo-estudio/types";
import type { Db } from "../db/pool";
import { AppError } from "../errors";

interface AdminEvaluationRow {
  id: string;
  tipo: AdminEvaluation["type"];
  titulo: string;
  habilidad: AdminEvaluation["skill"];
  nivel: AdminEvaluation["level"];
  publicada: boolean;
  preguntas: number;
  resultados: number;
}

const SELECT = `
  SELECT e.id, e.tipo, e.titulo, e.habilidad, e.nivel, e.publicada,
         (SELECT count(*)::int FROM preguntas p WHERE p.evaluacion_id = e.id) AS preguntas,
         (SELECT count(*)::int FROM resultados r WHERE r.evaluacion_id = e.id) AS resultados
    FROM evaluaciones e`;

function toAdminEvaluation(row: AdminEvaluationRow): AdminEvaluation {
  return {
    id: row.id,
    type: row.tipo,
    title: row.titulo,
    skill: row.habilidad,
    level: row.nivel,
    questionCount: row.preguntas,
    resultsCount: row.resultados,
    published: row.publicada,
  };
}

export const evaluacionNoExiste = () => new AppError(404, "EVALUACION_NO_EXISTE", "La evaluación no existe.");

export async function listAdminEvaluations(db: Db): Promise<AdminEvaluation[]> {
  const { rows } = await db.query<AdminEvaluationRow>(
    `${SELECT} ORDER BY (e.tipo = 'diagnostica') DESC, e.creado_en DESC, e.titulo`,
  );
  return rows.map(toAdminEvaluation);
}

export async function findAdminEvaluation(db: Db, id: string): Promise<AdminEvaluation | null> {
  const { rows } = await db.query<AdminEvaluationRow>(`${SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ? toAdminEvaluation(rows[0]) : null;
}

// Crea un test semanal con sus preguntas. Queda como borrador hasta que se publique.
export async function createWeeklyTest(db: Db, input: CreateWeeklyTestInput): Promise<string> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO evaluaciones (tipo, titulo, habilidad, nivel, publicada)
       VALUES ('semanal', $1, $2, $3, false) RETURNING id`,
      [input.title, input.skill, input.level],
    );
    const id = rows[0]!.id;
    for (const [orden, q] of input.questions.entries()) {
      await client.query(
        `INSERT INTO preguntas (evaluacion_id, orden, habilidad, competencia, enunciado, opciones, indice_correcto)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, orden + 1, input.skill, q.competency, q.prompt, q.options, q.correctIndex],
      );
    }
    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Al publicar un test semanal, su plazo de una semana empieza a correr desde hoy.
export async function setPublished(db: Db, id: string, published: boolean): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE evaluaciones
        SET publicada = $2,
            fecha_limite = CASE WHEN $2 AND tipo = 'semanal' AND NOT publicada THEN current_date + 7 ELSE fecha_limite END
      WHERE id = $1`,
    [id, published],
  );
  return (rowCount ?? 0) > 0;
}

export async function deleteEvaluation(db: Db, id: string): Promise<void> {
  // Preguntas y resultados se borran en cascada.
  await db.query("DELETE FROM evaluaciones WHERE id = $1", [id]);
}
