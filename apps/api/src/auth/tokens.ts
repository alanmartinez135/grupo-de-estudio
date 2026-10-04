import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Role, User } from "@grupo-estudio/types";
import type { Config } from "../config";
import type { Db } from "../db/pool";
import { findById, publicUser } from "../users/repository";
import { noAutenticado, sinPermiso } from "../errors";

export interface TokenPayload {
  sub: string; // id del usuario
  role: Role;
  type: "access" | "refresh";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: User;
  }
}

// Token de acceso (15 min) y de renovación (7 días), firmados con JWT_SECRET (RNF-B05).
export function issueTokens(app: FastifyInstance, config: Config, user: User) {
  const accessToken = app.jwt.sign({ sub: user.id, role: user.role, type: "access" }, { expiresIn: config.accessTokenTtl });
  const refreshToken = app.jwt.sign({ sub: user.id, role: user.role, type: "refresh" }, { expiresIn: config.refreshTokenTtl });
  return { accessToken, refreshToken };
}

// preHandler: exige un token de acceso válido y carga el usuario desde la base,
// así un cambio de rol o una cuenta eliminada se reflejan de inmediato.
export function makeAuthHooks(db: Db) {
  async function authenticate(request: FastifyRequest) {
    let payload: TokenPayload;
    try {
      payload = await request.jwtVerify<TokenPayload>();
    } catch {
      throw noAutenticado();
    }
    if (payload.type !== "access") throw noAutenticado();
    const user = await findById(db, payload.sub);
    if (!user) throw noAutenticado();
    request.currentUser = publicUser(user);
  }

  // El rol se valida en el servidor; el cliente no es fuente de confianza (RNF-B06).
  async function requireAdmin(request: FastifyRequest) {
    if (request.currentUser?.role !== "admin") throw sinPermiso();
  }

  return { authenticate, requireAdmin };
}
