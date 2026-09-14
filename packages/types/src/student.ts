import { z } from "zod";

export const EnglishLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type EnglishLevel = z.infer<typeof EnglishLevelSchema>;

export const JornadaSchema = z.enum(["diurna", "vespertina"]);
export type Jornada = z.infer<typeof JornadaSchema>;

export const StudentSchema = z.object({
  id: z.string().uuid(), //id del estudiante
  correo: z.string().min(1), //correo institucional
  name: z.string().min(1), //nombre del estudiante
  career: z.string().min(1), // ¿lista fija de carreras (enum) o texto libre? *por decidir
  jornada: JornadaSchema,
  englishLevel: EnglishLevelSchema, // autoevaluado — placeholder hasta que exista prueba diagnóstica real
});
export type Student = z.infer<typeof StudentSchema>;