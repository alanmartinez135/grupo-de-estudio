import { z } from "zod";
import { EnglishLevelSchema, JornadaSchema, StudentSchema } from "./student";

// Roles del sistema. Se usan los mismos valores que la app ("student" | "admin").
export const RoleSchema = z.enum(["student", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

// Usuario tal como lo entrega el API (nunca incluye la contraseña).
export const UserSchema = StudentSchema.extend({
  role: RoleSchema,
});
export type User = z.infer<typeof UserSchema>;

const correoInstitucional = z
  .string()
  .trim()
  .toLowerCase()
  .email("Correo inválido.")
  .refine((c) => c.endsWith("@duocuc.cl"), "Usa tu correo institucional (@duocuc.cl).");

// Entrada de POST /api/v1/auth/registro. La validan el formulario y el servidor.
export const RegisterInputSchema = z.object({
  correo: correoInstitucional,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128),
  name: z.string().trim().min(1, "Ingresa tu nombre.").max(120),
  career: z.string().trim().min(1, "Ingresa tu carrera.").max(120),
  jornada: JornadaSchema,
  englishLevel: EnglishLevelSchema,
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

// Entrada de POST /api/v1/auth/login.
export const LoginInputSchema = z.object({
  correo: z.string().trim().toLowerCase().min(1, "Ingresa tu correo."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// Entrada de POST /api/v1/auth/renovar.
export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

// Respuesta de registro, login y renovación.
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
