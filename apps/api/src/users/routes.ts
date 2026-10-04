import type { FastifyInstance } from "fastify";
import { RoleSchema, type User } from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { makeAuthHooks } from "../auth/tokens";
import { deleteUser } from "./repository";

const ListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  rol: RoleSchema.optional(),
});

export async function userRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const { authenticate, requireAdmin } = makeAuthHooks(db);

  // GET /api/v1/usuarios/me — datos del usuario de la sesión.
  app.get("/usuarios/me", { preHandler: authenticate }, async (request): Promise<User> => request.currentUser!);

  // DELETE /api/v1/usuarios/me — elimina la cuenta y sus datos (RNF-B10).
  app.delete("/usuarios/me", { preHandler: authenticate }, async (request, reply) => {
    await deleteUser(db, request.currentUser!.id);
    return reply.status(204).send();
  });

  // GET /api/v1/usuarios?q=&rol= — gestión de usuarios, solo administradores.
  app.get("/usuarios", { preHandler: [authenticate, requireAdmin] }, async (request): Promise<User[]> => {
    const { q, rol } = ListQuerySchema.parse(request.query);
    const { rows } = await db.query<{
      id: string;
      correo: string;
      nombre: string;
      carrera: string;
      jornada: User["jornada"];
      nivel_ingles: User["englishLevel"];
      rol: User["role"];
    }>(
      `SELECT id, correo, nombre, carrera, jornada, nivel_ingles, rol
         FROM usuarios
        WHERE ($1::text IS NULL OR nombre ILIKE '%' || $1 || '%' OR correo ILIKE '%' || $1 || '%')
          AND ($2::rol IS NULL OR rol = $2)
        ORDER BY nombre
        LIMIT 100`,
      [q || null, rol ?? null],
    );
    return rows.map((r) => ({
      id: r.id,
      correo: r.correo,
      name: r.nombre,
      career: r.carrera,
      jornada: r.jornada,
      englishLevel: r.nivel_ingles,
      role: r.rol,
    }));
  });
}
