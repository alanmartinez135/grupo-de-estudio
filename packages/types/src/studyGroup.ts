import { z } from "zod";
import { EnglishLevelSchema } from "./student";

export const StudyGroupSchema = z.object({
  id: z.string().uuid(), //id del grupo
  name: z.string().min(1), //nombre del grupo de estudio
  level: EnglishLevelSchema, //nivel med
  createdBy: z.string().uuid(), // id del estudiante que lo creó
  memberIds: z.array(z.string().uuid()),
});
export type StudyGroup = z.infer<typeof StudyGroupSchema>;