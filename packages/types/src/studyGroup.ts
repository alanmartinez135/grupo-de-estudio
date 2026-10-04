import { z } from "zod";
import { EnglishLevelSchema } from "./student";

export const MAX_GROUP_MEMBERS = 6;

export const StudyGroupSchema = z.object({
  id: z.string().uuid(), //id del grupo
  name: z.string().min(1), //nombre del grupo de estudio
  description: z.string(), //descripción visible en el listado
  code: z.string().regex(/^DUOC-\d{4}$/), //código de invitación, lo genera el servidor
  level: EnglishLevelSchema, //nivel del grupo, lo elige quien lo crea
  createdBy: z.string().uuid().nullable(), // id del estudiante que lo creó (null si eliminó su cuenta)
  memberIds: z.array(z.string().uuid()).max(MAX_GROUP_MEMBERS),
});
export type StudyGroup = z.infer<typeof StudyGroupSchema>;

// Datos públicos de un integrante (nunca correo ni contraseña).
export const GroupMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  career: z.string(),
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;

// Grupo tal como lo entrega el API: incluye a sus integrantes.
export const GroupWithMembersSchema = StudyGroupSchema.extend({
  members: z.array(GroupMemberSchema),
});
export type GroupWithMembers = z.infer<typeof GroupWithMembersSchema>;

// Entrada de POST /api/v1/grupos.
export const CreateGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Ingresa un nombre para el grupo.").max(80, "El nombre puede tener hasta 80 caracteres."),
  description: z.string().trim().max(300, "La descripción puede tener hasta 300 caracteres.").default(""),
  level: EnglishLevelSchema,
});
export type CreateGroupInput = z.input<typeof CreateGroupInputSchema>;

// Entrada de POST /api/v1/grupos/unirse.
export const JoinByCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^DUOC-\d{4}$/, "El código tiene el formato DUOC-1234."),
});
export type JoinByCodeInput = z.input<typeof JoinByCodeInputSchema>;
