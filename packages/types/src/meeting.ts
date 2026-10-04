import { z } from "zod";
import { GroupMemberSchema } from "./studyGroup";

export const MeetingModeSchema = z.enum(["presencial", "online"]);
export type MeetingMode = z.infer<typeof MeetingModeSchema>;

export const AttendanceSchema = z.enum(["yes", "no"]);
export type Attendance = z.infer<typeof AttendanceSchema>;

// Encuentro de estudio de un grupo (coordinación de encuentros, alcance del MVP).
export const MeetingSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  groupName: z.string(),
  topic: z.string(),
  startsAt: z.string(), // fecha y hora ISO 8601
  durationMinutes: z.number().int(),
  mode: MeetingModeSchema,
  location: z.string(), // sala/sede si es presencial, enlace si es online
  createdBy: z.string().uuid().nullable(),
  attendees: z.array(GroupMemberSchema), // quienes confirmaron que asistirán
  myResponse: AttendanceSchema.nullable(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

const MAX_DAYS_AHEAD = 90;

// Entrada de POST /api/v1/grupos/:id/encuentros.
export const CreateMeetingInputSchema = z
  .object({
    topic: z.string().trim().min(1, "Ingresa el tema del encuentro.").max(120, "El tema puede tener hasta 120 caracteres."),
    startsAt: z.iso.datetime({ offset: true, message: "Fecha y hora inválidas." }),
    durationMinutes: z.number().int().min(15, "La duración mínima es de 15 minutos.").max(240, "La duración máxima es de 4 horas."),
    mode: MeetingModeSchema,
    location: z.string().trim().min(1, "Indica el lugar o el enlace.").max(200, "El lugar puede tener hasta 200 caracteres."),
  })
  .refine((m) => new Date(m.startsAt).getTime() > Date.now(), {
    message: "El encuentro debe ser en el futuro.",
    path: ["startsAt"],
  })
  .refine((m) => new Date(m.startsAt).getTime() < Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000, {
    message: `El encuentro puede programarse hasta ${MAX_DAYS_AHEAD} días adelante.`,
    path: ["startsAt"],
  })
  .refine((m) => m.mode !== "online" || /^https:\/\/\S+$/i.test(m.location), {
    message: "Para un encuentro online, ingresa un enlace que empiece con https://",
    path: ["location"],
  });
export type CreateMeetingInput = z.input<typeof CreateMeetingInputSchema>;

// Entrada de PUT /api/v1/encuentros/:id/asistencia.
export const AttendanceInputSchema = z.object({ response: AttendanceSchema });
export type AttendanceInput = z.infer<typeof AttendanceInputSchema>;
