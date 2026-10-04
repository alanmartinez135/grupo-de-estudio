import type { FastifyInstance } from "fastify";
import { AttendanceInputSchema, CreateMeetingInputSchema, type Meeting } from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { AppError } from "../errors";
import { makeAuthHooks } from "../auth/tokens";
import { grupoNoExiste } from "../groups/repository";
import {
  createMeeting,
  deleteMeeting,
  encuentroNoExiste,
  findMeeting,
  groupExists,
  isMember,
  listGroupMeetings,
  listUpcomingForUser,
  noEsIntegrante,
  setAttendance,
} from "./repository";

const idFrom = (params: unknown, notFound: () => AppError) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(params);
  if (!parsed.success) throw notFound();
  return parsed.data.id;
};

export async function meetingRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const { authenticate } = makeAuthHooks(db);
  app.addHook("preHandler", authenticate);

  // Verifica que el grupo exista y que el usuario sea integrante.
  async function requireMember(groupId: string, userId: string) {
    if (!(await groupExists(db, groupId))) throw grupoNoExiste();
    if (!(await isMember(db, groupId, userId))) throw noEsIntegrante();
  }

  // GET /api/v1/grupos/:id/encuentros — encuentros vigentes del grupo (solo integrantes).
  app.get("/grupos/:id/encuentros", async (request): Promise<Meeting[]> => {
    const groupId = idFrom(request.params, grupoNoExiste);
    await requireMember(groupId, request.currentUser!.id);
    return listGroupMeetings(db, groupId, request.currentUser!.id);
  });

  // POST /api/v1/grupos/:id/encuentros — proponer un encuentro (solo integrantes).
  app.post("/grupos/:id/encuentros", async (request, reply) => {
    const groupId = idFrom(request.params, grupoNoExiste);
    const input = CreateMeetingInputSchema.parse(request.body);
    await requireMember(groupId, request.currentUser!.id);
    const meeting = await createMeeting(db, groupId, request.currentUser!.id, input);
    return reply.status(201).send(meeting);
  });

  // GET /api/v1/encuentros/proximos — próximos encuentros de todos mis grupos.
  app.get("/encuentros/proximos", async (request): Promise<Meeting[]> => listUpcomingForUser(db, request.currentUser!.id));

  // PUT /api/v1/encuentros/:id/asistencia — confirmar o rechazar asistencia.
  app.put("/encuentros/:id/asistencia", async (request): Promise<Meeting> => {
    const meetingId = idFrom(request.params, encuentroNoExiste);
    const { response } = AttendanceInputSchema.parse(request.body);
    const userId = request.currentUser!.id;
    const meeting = await findMeeting(db, meetingId, userId);
    if (!meeting) throw encuentroNoExiste();
    if (!(await isMember(db, meeting.groupId, userId))) throw noEsIntegrante();
    await setAttendance(db, meetingId, userId, response);
    return (await findMeeting(db, meetingId, userId))!;
  });

  // DELETE /api/v1/encuentros/:id — cancelar (solo quien lo propuso).
  app.delete("/encuentros/:id", async (request, reply) => {
    const meetingId = idFrom(request.params, encuentroNoExiste);
    const meeting = await findMeeting(db, meetingId, request.currentUser!.id);
    if (!meeting) throw encuentroNoExiste();
    if (meeting.createdBy !== request.currentUser!.id) {
      throw new AppError(403, "SIN_PERMISO", "Solo quien propuso el encuentro puede cancelarlo.");
    }
    await deleteMeeting(db, meetingId);
    return reply.status(204).send();
  });
}
