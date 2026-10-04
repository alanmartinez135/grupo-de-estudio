import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import type { Config } from "./config";
import type { Db } from "./db/pool";
import { errorHandler } from "./errors";
import { authRoutes } from "./auth/routes";
import { userRoutes } from "./users/routes";
import { groupRoutes } from "./groups/routes";

export async function buildApp({ config, db }: { config: Config; db: Db }) {
  const app = Fastify({
    logger: config.logger && {
      // Nunca registrar contraseñas ni tokens en los logs (RNF-B10).
      redact: ["req.headers.authorization", "req.body.password", "req.body.refreshToken"],
    },
  });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({ error: { codigo: "NO_ENCONTRADO", mensaje: "El recurso no existe." } }),
  );

  // CORS limitado a los orígenes de CORS_ORIGIN; la app nativa no lo necesita (RNF-B07).
  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await app.register(jwt, { secret: config.jwtSecret });
  // El límite se evalúa después de leer el cuerpo, para poder usar el correo en la clave.
  await app.register(rateLimit, { global: false, hook: "preHandler" });

  // GET /health — para Docker y para revisar que la API y la base respondan (RNF-B11).
  app.get("/health", async () => {
    await db.query("SELECT 1");
    return { status: "ok" };
  });

  await app.register(authRoutes, { prefix: "/api/v1", db, config });
  await app.register(userRoutes, { prefix: "/api/v1", db });
  await app.register(groupRoutes, { prefix: "/api/v1", db });

  return app;
}
