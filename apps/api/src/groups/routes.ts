import type { FastifyInstance } from "fastify";
import { CreateGroupInputSchema, JoinByCodeInputSchema, type GroupWithMembers } from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { AppError } from "../errors";
import { makeAuthHooks } from "../auth/tokens";
import {
  createGroup,
  findGroup,
  findGroupIdByCode,
  grupoNoExiste,
  joinGroup,
  leaveGroup,
  listGroups,
} from "./repository";

// Un id mal formado se responde como "no existe" en vez de dejar que PostgreSQL falle.
function groupIdFrom(params: unknown): string {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(params);
  if (!parsed.success) throw grupoNoExiste();
  return parsed.data.id;
}

export async function groupRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const { authenticate } = makeAuthHooks(db);
  app.addHook("preHandler", authenticate); // todas las rutas de grupos requieren sesión

  // GET /api/v1/grupos — todos los grupos con sus integrantes.
  app.get("/grupos", async (): Promise<GroupWithMembers[]> => listGroups(db));

  // POST /api/v1/grupos — crea un grupo; quien lo crea queda como integrante.
  app.post("/grupos", async (request, reply) => {
    const input = CreateGroupInputSchema.parse(request.body);
    const group = await createGroup(db, request.currentUser!.id, input);
    return reply.status(201).send(group);
  });

  // GET /api/v1/grupos/:id — detalle del grupo.
  app.get("/grupos/:id", async (request): Promise<GroupWithMembers> => {
    const group = await findGroup(db, groupIdFrom(request.params));
    if (!group) throw grupoNoExiste();
    return group;
  });

  // POST /api/v1/grupos/unirse — unirse con el código de invitación.
  app.post("/grupos/unirse", async (request): Promise<GroupWithMembers> => {
    const { code } = JoinByCodeInputSchema.parse(request.body);
    const groupId = await findGroupIdByCode(db, code);
    if (!groupId) throw new AppError(404, "CODIGO_INVALIDO", "No existe un grupo con ese código.");
    return joinGroup(db, request.currentUser!.id, groupId);
  });

  // POST /api/v1/grupos/:id/integrantes — unirse desde el listado de grupos abiertos.
  app.post("/grupos/:id/integrantes", async (request): Promise<GroupWithMembers> =>
    joinGroup(db, request.currentUser!.id, groupIdFrom(request.params)),
  );

  // DELETE /api/v1/grupos/:id/integrantes/me — abandonar el grupo.
  app.delete("/grupos/:id/integrantes/me", async (request, reply) => {
    await leaveGroup(db, request.currentUser!.id, groupIdFrom(request.params));
    return reply.status(204).send();
  });
}
