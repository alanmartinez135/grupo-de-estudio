import type { CompetencyScore, DiagnosticResult, EnglishLevel, Skill } from "@grupo-estudio/types";
import { AppError } from "../errors";

export interface GradableQuestion {
  id: string;
  skill: Skill;
  competency: string;
  correctIndex: number;
}

export interface Grade {
  correct: number;
  total: number;
  score: number; // porcentaje 0-100
  byQuestion: Record<string, boolean>;
}

// Califica las respuestas en el servidor. Exige que estén todas las preguntas respondidas.
export function grade(questions: GradableQuestion[], answers: Record<string, number>): Grade {
  const missing = questions.filter((q) => answers[q.id] === undefined);
  if (missing.length > 0) {
    throw new AppError(400, "RESPUESTAS_INCOMPLETAS", "Responde todas las preguntas antes de enviar.");
  }
  const byQuestion = Object.fromEntries(questions.map((q) => [q.id, answers[q.id] === q.correctIndex]));
  const correct = Object.values(byQuestion).filter(Boolean).length;
  return { correct, total: questions.length, score: Math.round((correct / questions.length) * 100), byQuestion };
}

// Escala provisoria de puntaje a nivel MCER. Se debe calibrar con la coordinación de inglés
// cuando el diagnóstico tenga más preguntas (la rúbrica de writing queda como referencia).
export const LEVEL_THRESHOLDS: { min: number; level: EnglishLevel }[] = [
  { min: 95, level: "C2" },
  { min: 85, level: "C1" },
  { min: 70, level: "B2" },
  { min: 50, level: "B1" },
  { min: 30, level: "A2" },
  { min: 0, level: "A1" },
];

export function levelFromScore(score: number): EnglishLevel {
  return LEVEL_THRESHOLDS.find((t) => score >= t.min)!.level;
}

const STRENGTH_THRESHOLD = 70; // % de aciertos para considerar una competencia como fortaleza

const RECOMMENDATIONS: Record<string, string> = {
  Vocabulario: "Amplía tu vocabulario con lecturas cortas diarias y anota cinco palabras nuevas por día.",
  "Comprensión lectora": "Practica skimming (idea general) y scanning (datos específicos) con textos breves antes de leer en detalle.",
  Gramática: "Repasa los tiempos verbales y los condicionales con ejercicios cortos de writing.",
  Conectores: "Practica conectores de contraste y adición (however, although, despite, moreover) escribiendo párrafos breves.",
};

// Arma el resultado completo del diagnóstico a partir de la calificación.
export function buildDiagnosticResult(questions: GradableQuestion[], g: Grade, completedAt: Date): DiagnosticResult {
  const groups = new Map<string, { skill: Skill; ok: number; n: number }>();
  for (const q of questions) {
    const entry = groups.get(q.competency) ?? { skill: q.skill, ok: 0, n: 0 };
    entry.n += 1;
    if (g.byQuestion[q.id]) entry.ok += 1;
    groups.set(q.competency, entry);
  }
  const competencies: CompetencyScore[] = [...groups.entries()].map(([name, e]) => ({
    name,
    skill: e.skill,
    score: Math.round((e.ok / e.n) * 100),
  }));

  const strengths = competencies.filter((c) => c.score >= STRENGTH_THRESHOLD).map((c) => c.name);
  const weaknesses = competencies.filter((c) => c.score < STRENGTH_THRESHOLD).map((c) => c.name);
  const level = levelFromScore(g.score);

  const recommendations = weaknesses.map((w) => RECOMMENDATIONS[w]).filter((r): r is string => Boolean(r));
  if (recommendations.length === 0) {
    recommendations.push("Mantén la práctica con los tests semanales y desafíate con lecturas de un nivel más alto.");
  }
  recommendations.push(`Únete a un grupo de estudio de nivel ${level} para practicar con compañeros de tu mismo nivel.`);

  return {
    overallScore: g.score,
    level,
    correct: g.correct,
    total: g.total,
    competencies,
    strengths,
    weaknesses,
    recommendations,
    completedAt: completedAt.toISOString(),
  };
}
