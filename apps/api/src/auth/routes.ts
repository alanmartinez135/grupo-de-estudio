import type { FastifyInstance } from "fastify";
import {
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
  type AuthResponse,
} from "@grupo-estudio/types";
import type { Config } from "../config";
import { type Db, isUniqueViolation } from "../db/pool";
import { AppError, credencialesInvalidas, noAutenticado } from "../errors";
import { findByCorreo, findById, insertUser, publicUser } from "../users/repository";
import { getDummyHash, hashPassword, verifyPassword } from "./password";
import { issueTokens, type TokenPayload } from "./tokens";

interface Options {
  db: Db;
  config: Config;
}

export async function authRoutes(app: FastifyInstance, { db, config }: Options) {
  // POST /api/v1/auth/registro — siempre crea un estudiante.
  app.post("/auth/registro", async (request, reply) => {
    const input = RegisterInputSchema.parse(request.body);
    let user;
    try {
      user = await insertUser(db, { ...input, passwordHash: await hashPassword(input.password) });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, "CORREO_REGISTRADO", "Ya existe una cuenta con ese correo.");
      }
      throw error;
    }
    const body: AuthResponse = { ...issueTokens(app, config, publicUser(user)), user: publicUser(user) };
    return reply.status(201).send(body);
  });

  // POST /api/v1/auth/login — máximo LOGIN_RATE_LIMIT intentos por minuto por IP y correo (RNF-B08).
  app.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: config.loginRateLimit,
          timeWindow: "1 minute",
          keyGenerator: (request) => {
            const correo = (request.body as { correo?: unknown } | undefined)?.correo;
            return `${request.ip}|${typeof correo === "string" ? correo.trim().toLowerCase() : ""}`;
          },
        },
      },
    },
    async (request): Promise<AuthResponse> => {
      const { correo, password } = LoginInputSchema.parse(request.body);
      const user = await findByCorreo(db, correo);
      // Se verifica siempre, exista o no el correo, para no revelar cuentas registradas (H1).
      const valid = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);
      if (!user || !valid) throw credencialesInvalidas();
      return { ...issueTokens(app, config, publicUser(user)), user: publicUser(user) };
    },
  );

  // POST /api/v1/auth/renovar — entrega tokens nuevos a partir del token de renovación.
  app.post("/auth/renovar", async (request): Promise<AuthResponse> => {
    const { refreshToken } = RefreshInputSchema.parse(request.body);
    let payload: TokenPayload;
    try {
      payload = app.jwt.verify<TokenPayload>(refreshToken);
    } catch {
      throw noAutenticado();
    }
    if (payload.type !== "refresh") throw noAutenticado();
    const user = await findById(db, payload.sub);
    if (!user) throw noAutenticado();
    return { ...issueTokens(app, config, publicUser(user)), user: publicUser(user) };
  });
}
