import type { DiagnosticResult, EnglishLevel, Question, Skill, WeeklyTestSummary } from "@grupo-estudio/types";
import { type Db, isUniqueViolation } from "../db/pool";
import { AppError } from "../errors";
import type { GradableQuestion } from "./scoring";

export interface FullQuestion extends Question, GradableQuestion {}

interface QuestionRow {
  id: string;
  habilidad: Skill;
  competencia: string;
  enunciado: string;
  opciones: string[];
  indice_correcto: number;
}

export async function questionsOf(db: Db, evaluationId: string): Promise<FullQuestion[]> {
  const { rows } = await db.query<QuestionRow>(
    `SELECT id, habilidad, competencia, enunciado, opciones, indice_correcto
       FROM preguntas WHERE evaluacion_id = $1 ORDER BY orden`,
    [evaluationId],
  );
  return rows.map((r) => ({
    id: r.id,
    skill: r.habilidad,
    competency: r.competencia,
    prompt: r.enunciado,
    options: r.opciones,
    correctIndex: r.indice_correcto,
  }));
}

// Versión para el cliente: sin la respuesta correcta (H5).
export function toPublicQuestion({ correctIndex: _omit, ...q }: FullQuestion): Question {
  return q;
}

// ---------------------------------------------------------------- diagnóstico

export async function findDiagnostic(db: Db): Promise<{ id: string; title: string } | null> {
  const { rows } = await db.query<{ id: string; titulo: string }>(
    `SELECT id, titulo FROM evaluaciones
      WHERE tipo = 'diagnostica' AND publicada ORDER BY creado_en LIMIT 1`,
  );
  return rows[0] ? { id: rows[0].id, title: rows[0].titulo } : null;
}

export async function findDiagnosticResult(db: Db, userId: string): Promise<DiagnosticResult | null> {
  const { rows } = await db.query<{ detalle: DiagnosticResult }>(
    `SELECT r.detalle FROM resultados r
       JOIN evaluaciones e ON e.id = r.evaluacion_id
      WHERE e.tipo = 'diagnostica' AND r.usuario_id = $1
      ORDER BY r.rendido_en DESC LIMIT 1`,
    [userId],
  );
  return rows[0]?.detalle ?? null;
}

// Guarda el resultado y actualiza el nivel del estudiante en una sola transacción.
export async function saveDiagnosticResult(
  db: Db,
  args: { evaluationId: string; userId: string; answers: Record<string, number>; result: DiagnosticResult },
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO resultados (evaluacion_id, usuario_id, respuestas, correctas, total, puntaje, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [args.evaluationId, args.userId, args.answers, args.result.correct, args.result.total, args.result.overallScore, args.result],
    );
    await client.query("UPDATE usuarios SET nivel_ingles = $1 WHERE id = $2", [args.result.level, args.userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (isUniqueViolation(error)) throw diagnosticoRendido();
    throw error;
  } finally {
    client.release();
  }
}

export const diagnosticoRendido = () =>
  new AppError(409, "DIAGNOSTICO_RENDIDO", "Ya rendiste la evaluación diagnóstica.");

// ---------------------------------------------------------------- tests semanales

interface WeeklyRow {
  id: string;
  titulo: string;
  habilidad: Skill;
  nivel: EnglishLevel;
  fecha_limite: string | null;
  total: number;
  puntaje: number | null;
  grupos: string[];
}

function toSummary(r: WeeklyRow): WeeklyTestSummary {
  return {
    id: r.id,
    title: r.titulo,
    skill: r.habilidad,
    level: r.nivel,
    dueDate: r.fecha_limite,
    status: r.puntaje === null ? "pending" : "completed",
    score: r.puntaje,
    totalQuestions: r.total,
    groupIds: r.grupos,
  };
}

// Tests semanales que le corresponden al estudiante: los del nivel de cada grupo al que pertenece.
const WEEKLY_FOR_USER = `
  SELECT e.id, e.titulo, e.habilidad, e.nivel,
         to_char(e.fecha_limite, 'YYYY-MM-DD') AS fecha_limite,
         (SELECT count(*)::int FROM preguntas p WHERE p.evaluacion_id = e.id) AS total,
         r.puntaje,
         array_agg(DISTINCT g.id::text) AS grupos
    FROM evaluaciones e
    JOIN grupos g ON g.nivel = e.nivel
    JOIN grupo_integrantes gi ON gi.grupo_id = g.id AND gi.usuario_id = $1
    LEFT JOIN resultados r ON r.evaluacion_id = e.id AND r.usuario_id = $1
   WHERE e.tipo = 'semanal' AND e.publicada`;

export async function listWeeklyTests(db: Db, userId: string): Promise<WeeklyTestSummary[]> {
  const { rows } = await db.query<WeeklyRow>(
    `${WEEKLY_FOR_USER} GROUP BY e.id, r.puntaje ORDER BY e.fecha_limite NULLS LAST, e.titulo`,
    [userId],
  );
  return rows.map(toSummary);
}

// Devuelve el test si existe y le corresponde al estudiante; si no, 404 o 403.
export async function findWeeklyTestForUser(db: Db, userId: string, testId: string): Promise<WeeklyTestSummary> {
  const { rows } = await db.query<WeeklyRow>(`${WEEKLY_FOR_USER} AND e.id = $2 GROUP BY e.id, r.puntaje`, [userId, testId]);
  if (rows[0]) return toSummary(rows[0]);

  const exists = await db.query("SELECT 1 FROM evaluaciones WHERE id = $1 AND tipo = 'semanal' AND publicada", [testId]);
  if (exists.rowCount === 0) throw testNoExiste();
  throw new AppError(403, "SIN_PERMISO", "Este test no corresponde al nivel de tus grupos.");
}

export const testNoExiste = () => new AppError(404, "TEST_NO_EXISTE", "El test no existe.");

export async function saveTestResult(
  db: Db,
  args: { testId: string; userId: string; answers: Record<string, number>; correct: number; total: number; score: number },
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO resultados (evaluacion_id, usuario_id, respuestas, correctas, total, puntaje)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [args.testId, args.userId, args.answers, args.correct, args.total, args.score],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "TEST_COMPLETADO", "Ya completaste este test.");
    throw error;
  }
}
