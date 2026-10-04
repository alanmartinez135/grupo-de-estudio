import { z } from "zod";
import { EnglishLevelSchema } from "./student";

export const MAX_GROUP_MEMBERS = 6;

export const StudyGroupSchema = z.object({
  id: z.string().uuid(), //id del grupo
  name: z.string().min(1), //nombre del grupo de estudio
  description: z.string(), //descripción visible en el listado
  code: z.string().regex(/^DUOC-\d{4}$/), //código de invitación, lo genera el servidor
  level: EnglishLevelSchema, //nivel del grupo, lo elige quien lo crea
  createdBy: z.string().uuid(), // id del estudiante que lo creó
  memberIds: z.array(z.string().uuid()).max(MAX_GROUP_MEMBERS),
});
export type StudyGroup = z.infer<typeof StudyGroupSchema>;
