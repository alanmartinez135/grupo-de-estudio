import type { Db } from "./pool";
import { DIAGNOSTICO, TESTS_SEMANALES, type EvaluationContent } from "../content/evaluaciones";

async function insertQuestions(db: Db, evaluation: EvaluationContent) {
  for (const [orden, q] of evaluation.questions.entries()) {
    await db.query(
      `INSERT INTO preguntas (id, evaluacion_id, orden, habilidad, competencia, enunciado, opciones, indice_correcto)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [q.id, evaluation.id, orden + 1, q.skill, q.competency, q.prompt, q.options, q.correctIndex],
    );
  }
}

// Carga el contenido inicial (src/content/evaluaciones.ts) solo en una base sin evaluaciones.
// Así, lo que un administrador elimine o modifique no reaparece al reiniciar la API.
export async function seedContent(db: Db): Promise<void> {
  const { rows } = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM evaluaciones");
  if (rows[0]!.n > 0) return;

  await db.query(
    `INSERT INTO evaluaciones (id, tipo, titulo) VALUES ($1, 'diagnostica', $2) ON CONFLICT (id) DO NOTHING`,
    [DIAGNOSTICO.id, DIAGNOSTICO.title],
  );
  await insertQuestions(db, DIAGNOSTICO);

  for (const test of TESTS_SEMANALES) {
    // Fecha límite: una semana desde que se carga el contenido.
    await db.query(
      `INSERT INTO evaluaciones (id, tipo, titulo, habilidad, nivel, fecha_limite)
       VALUES ($1, 'semanal', $2, $3, $4, current_date + 7)
       ON CONFLICT (id) DO NOTHING`,
      [test.id, test.title, test.skill, test.level],
    );
    await insertQuestions(db, test);
  }
}
