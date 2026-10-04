import { z } from "zod";
import { EnglishLevelSchema } from "./student";

export const SkillSchema = z.enum(["reading", "writing"]);
export type Skill = z.infer<typeof SkillSchema>;

// Pregunta tal como la recibe el cliente: sin la respuesta correcta (H5).
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  skill: SkillSchema,
  competency: z.string(), // por ejemplo "Vocabulario", "Gramática"
  prompt: z.string(),
  options: z.array(z.string()).min(2),
});
export type Question = z.infer<typeof QuestionSchema>;

// Respuestas del estudiante: id de pregunta → índice de la alternativa elegida.
export const AnswersInputSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
});
export type AnswersInput = z.infer<typeof AnswersInputSchema>;

// --- Evaluación diagnóstica ---
export const DiagnosticTestSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  questions: z.array(QuestionSchema),
});
export type DiagnosticTest = z.infer<typeof DiagnosticTestSchema>;

export const CompetencyScoreSchema = z.object({
  name: z.string(),
  skill: SkillSchema,
  score: z.number().min(0).max(100),
});
export type CompetencyScore = z.infer<typeof CompetencyScoreSchema>;

export const DiagnosticResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  level: EnglishLevelSchema, // nivel asignado por el diagnóstico
  correct: z.number().int(),
  total: z.number().int(),
  competencies: z.array(CompetencyScoreSchema),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  completedAt: z.string(), // fecha ISO 8601
});
export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

// --- Tests semanales ---
export const WeeklyTestSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  skill: SkillSchema,
  level: EnglishLevelSchema,
  dueDate: z.string().nullable(), // YYYY-MM-DD
  status: z.enum(["pending", "completed"]),
  score: z.number().nullable(), // porcentaje, solo si está completado
  totalQuestions: z.number().int(),
  groupIds: z.array(z.string().uuid()), // grupos del estudiante a los que corresponde (por nivel)
});
export type WeeklyTestSummary = z.infer<typeof WeeklyTestSummarySchema>;

export const WeeklyTestDetailSchema = WeeklyTestSummarySchema.extend({
  questions: z.array(QuestionSchema),
});
export type WeeklyTestDetail = z.infer<typeof WeeklyTestDetailSchema>;

export const TestResultSchema = z.object({
  correct: z.number().int(),
  total: z.number().int(),
  score: z.number().min(0).max(100),
});
export type TestResult = z.infer<typeof TestResultSchema>;
