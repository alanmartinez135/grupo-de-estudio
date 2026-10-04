import type { FastifyInstance } from "fastify";
import { RoleSchema, UpdateRoleInputSchema, type User } from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { makeAuthHooks } from "../auth/tokens";
import { AppError } from "../errors";
import { deleteUser, findById, publicUser, updateRole } from "./repository";

const IdParamsSchema = z.object({ id: z.string().uuid("Usuario no encontrado.") });

const usuarioNoExiste = () => new AppError(404, "USUARIO_NO_EXISTE", "El usuario no existe.");

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

  // PATCH /api/v1/usuarios/:id/rol — un administrador cambia el rol de otra cuenta.
  app.patch("/usuarios/:id/rol", { preHandler: [authenticate, requireAdmin] }, async (request): Promise<User> => {
    const { id } = IdParamsSchema.parse(request.params);
    const { role } = UpdateRoleInputSchema.parse(request.body);
    // Evita que el último administrador se quite el acceso a sí mismo.
    if (id === request.currentUser!.id) {
      throw new AppError(409, "ES_TU_CUENTA", "No puedes cambiar tu propio rol.");
    }
    const user = await updateRole(db, id, role);
    if (!user) throw usuarioNoExiste();
    return publicUser(user);
  });

  // DELETE /api/v1/usuarios/:id — un administrador elimina otra cuenta y sus datos.
  app.delete("/usuarios/:id", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params);
    if (id === request.currentUser!.id) {
      throw new AppError(409, "ES_TU_CUENTA", "Para eliminar tu propia cuenta usa Ajustes.");
    }
    if (!(await findById(db, id))) throw usuarioNoExiste();
    await deleteUser(db, id);
    return reply.status(204).send();
  });
}
