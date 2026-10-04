import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Carga apps/api/.env si existe (Node 24 lo soporta sin dependencias extra).
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name} (ver apps/api/.env.example).`);
  return value;
}

export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigins: string[];
  accessTokenTtl: string;
  refreshTokenTtl: string;
  loginRateLimit: number;
  logger: boolean;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
    databaseUrl: overrides.databaseUrl ?? required("DATABASE_URL"),
    jwtSecret: overrides.jwtSecret ?? required("JWT_SECRET"),
    corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:8081")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
    loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT ?? 5),
    logger: process.env.NODE_ENV !== "test",
    ...overrides,
  };
}
