import type { FastifyInstance } from "fastify";
import { CreateWeeklyTestInputSchema, PublishInputSchema, type AdminEvaluation } from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { makeAuthHooks } from "../auth/tokens";
import { AppError } from "../errors";
import {
  createWeeklyTest,
  deleteEvaluation,
  evaluacionNoExiste,
  findAdminEvaluation,
  listAdminEvaluations,
  setPublished,
} from "./repository";

const IdParamsSchema = z.object({ id: z.string().uuid("La evaluación no existe.") });

// Gestión de evaluaciones (RF de administración). Todas las rutas exigen rol administrador,
// verificado contra la base en cada solicitud (RNF-B06).
export async function adminRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const { authenticate, requireAdmin } = makeAuthHooks(db);
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireAdmin);

  // GET /api/v1/admin/evaluaciones — todas, incluidos los borradores.
  app.get("/admin/evaluaciones", async (): Promise<AdminEvaluation[]> => listAdminEvaluations(db));

  // POST /api/v1/admin/evaluaciones — nuevo test semanal (borrador).
  app.post("/admin/evaluaciones", async (request, reply) => {
    const input = CreateWeeklyTestInputSchema.parse(request.body);
    const id = await createWeeklyTest(db, input);
    return reply.status(201).send(await findAdminEvaluation(db, id));
  });

  // PATCH /api/v1/admin/evaluaciones/:id — publicar o volver a borrador.
  app.patch("/admin/evaluaciones/:id", async (request): Promise<AdminEvaluation> => {
    const { id } = IdParamsSchema.parse(request.params);
    const { published } = PublishInputSchema.parse(request.body);
    const current = await findAdminEvaluation(db, id);
    if (!current) throw evaluacionNoExiste();
    if (current.type === "diagnostica" && !published) {
      throw new AppError(409, "DIAGNOSTICO_PROTEGIDO", "La evaluación diagnóstica no se puede despublicar.");
    }
    await setPublished(db, id, published);
    return (await findAdminEvaluation(db, id))!;
  });

  // DELETE /api/v1/admin/evaluaciones/:id — elimina el test, sus preguntas y resultados.
  app.delete("/admin/evaluaciones/:id", async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params);
    const current = await findAdminEvaluation(db, id);
    if (!current) throw evaluacionNoExiste();
    if (current.type === "diagnostica") {
      throw new AppError(409, "DIAGNOSTICO_PROTEGIDO", "La evaluación diagnóstica no se puede eliminar.");
    }
    await deleteEvaluation(db, id);
    return reply.status(204).send();
  });
}
