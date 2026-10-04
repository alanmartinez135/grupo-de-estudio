import { z } from "zod";
import { RoleSchema } from "./auth";
import { EnglishLevelSchema } from "./student";
import { SkillSchema } from "./evaluation";

// PATCH /api/v1/usuarios/:id/rol
export const UpdateRoleInputSchema = z.object({ role: RoleSchema });
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

// Evaluación tal como la ve el administrador (incluye borradores).
export const AdminEvaluationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["diagnostica", "semanal"]),
  title: z.string(),
  skill: SkillSchema.nullable(),
  level: EnglishLevelSchema.nullable(),
  questionCount: z.number().int(),
  resultsCount: z.number().int(), // cuántos estudiantes ya la respondieron
  published: z.boolean(),
});
export type AdminEvaluation = z.infer<typeof AdminEvaluationSchema>;

export const NewQuestionInputSchema = z
  .object({
    prompt: z.string().trim().min(1, "Cada pregunta necesita un enunciado.").max(300),
    options: z
      .array(z.string().trim().min(1, "Completa todas las alternativas.").max(150))
      .min(2, "Cada pregunta necesita al menos 2 alternativas.")
      .max(6, "Cada pregunta puede tener hasta 6 alternativas."),
    correctIndex: z.number().int().min(0),
    competency: z.string().trim().min(1).max(60),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "Marca cuál es la alternativa correcta.",
    path: ["correctIndex"],
  });
export type NewQuestionInput = z.infer<typeof NewQuestionInputSchema>;

// POST /api/v1/admin/evaluaciones — crea un test semanal (queda como borrador).
export const CreateWeeklyTestInputSchema = z.object({
  title: z.string().trim().min(1, "Ingresa un título.").max(80, "El título puede tener hasta 80 caracteres."),
  skill: SkillSchema,
  level: EnglishLevelSchema,
  questions: z.array(NewQuestionInputSchema).min(1, "Agrega al menos una pregunta.").max(20, "Un test puede tener hasta 20 preguntas."),
});
export type CreateWeeklyTestInput = z.infer<typeof CreateWeeklyTestInputSchema>;

// PATCH /api/v1/admin/evaluaciones/:id
export const PublishInputSchema = z.object({ published: z.boolean() });
export type PublishInput = z.infer<typeof PublishInputSchema>;
