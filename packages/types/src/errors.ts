import { z } from "zod";

// Formato único de error del API (ver anexo técnico, hallazgo H6 y punto 5 del 4.6).
// Todas las respuestas con estado 4xx o 5xx usan esta forma.
export const ApiErrorSchema = z.object({
  error: z.object({
    codigo: z.string(), // identificador estable, por ejemplo "CREDENCIALES_INVALIDAS"
    mensaje: z.string(), // texto para mostrar al usuario
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
