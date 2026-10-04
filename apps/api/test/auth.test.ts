import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Db } from "../src/db/pool";
import { createTestApp, nuevoEstudiante, resetDb } from "./helpers";

// Pruebas de integración: API real (Fastify inject) contra PostgreSQL de pruebas.
let app: FastifyInstance;
let db: Db;

beforeEach(async () => {
  if (!app) ({ app, db } = await createTestApp());
  await resetDb(db);
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

const registrar = (body: Record<string, unknown>) => app.inject({ method: "POST", url: "/api/v1/auth/registro", payload: body });
const login = (correo: string, password: string) =>
  app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { correo, password } });

describe("POST /api/v1/auth/registro", () => {
  it("crea un estudiante y devuelve tokens sin exponer la contraseña", async () => {
    const res = await registrar(nuevoEstudiante());
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.accessToken).toBeTypeOf("string");
    expect(body.refreshToken).toBeTypeOf("string");
    expect(body.user).toMatchObject({ correo: "camila.rojas@duocuc.cl", role: "student", englishLevel: "B1" });
    expect(body.user.password).toBeUndefined();
    expect(body.user.passwordHash).toBeUndefined();

    const { rows } = await db.query("SELECT password_hash FROM usuarios");
    expect(rows[0].password_hash).not.toBe("clave-segura-123");
  });

  it("normaliza el correo a minúsculas", async () => {
    const res = await registrar(nuevoEstudiante({ correo: "  Camila.Rojas@DuocUC.cl " }));
    expect(res.json().user.correo).toBe("camila.rojas@duocuc.cl");
  });

  it("rechaza correos que no son @duocuc.cl", async () => {
    const res = await registrar(nuevoEstudiante({ correo: "camila@gmail.com" }));
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: { codigo: "DATOS_INVALIDOS", mensaje: "Usa tu correo institucional (@duocuc.cl)." },
    });
  });

  it("rechaza contraseñas de menos de 8 caracteres", async () => {
    const res = await registrar(nuevoEstudiante({ password: "corta" }));
    expect(res.statusCode).toBe(400);
  });

  it("ignora un rol enviado por el cliente: siempre crea estudiantes", async () => {
    const res = await registrar(nuevoEstudiante({ role: "admin" }));
    expect(res.json().user.role).toBe("student");
  });

  it("responde 409 si el correo ya está registrado", async () => {
    await registrar(nuevoEstudiante());
    const res = await registrar(nuevoEstudiante());
    expect(res.statusCode).toBe(409);
    expect(res.json().error.codigo).toBe("CORREO_REGISTRADO");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("inicia sesión con credenciales correctas", async () => {
    await registrar(nuevoEstudiante());
    const res = await login("camila.rojas@duocuc.cl", "clave-segura-123");
    expect(res.statusCode).toBe(200);
    expect(res.json().user.name).toBe("Camila Rojas");
  });

  it("responde lo mismo para contraseña incorrecta y correo inexistente (H1)", async () => {
    await registrar(nuevoEstudiante());
    const malaClave = await login("camila.rojas@duocuc.cl", "incorrecta");
    const noExiste = await login("nadie@duocuc.cl", "incorrecta");
    expect(malaClave.statusCode).toBe(401);
    expect(noExiste.statusCode).toBe(401);
    expect(malaClave.json()).toEqual(noExiste.json());
    expect(malaClave.json().error.codigo).toBe("CREDENCIALES_INVALIDAS");
  });

  it("bloquea con 429 después de 5 intentos por minuto (RNF-B08)", async () => {
    const correo = "fuerza.bruta@duocuc.cl";
    for (let i = 0; i < 5; i++) expect((await login(correo, "x")).statusCode).toBe(401);
    const bloqueado = await login(correo, "x");
    expect(bloqueado.statusCode).toBe(429);
    expect(bloqueado.json().error.codigo).toBe("DEMASIADOS_INTENTOS");
  });
});

describe("rutas protegidas", () => {
  it("GET /usuarios/me sin token responde 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/usuarios/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.codigo).toBe("NO_AUTENTICADO");
  });

  it("GET /usuarios/me con token devuelve el usuario", async () => {
    const { accessToken } = (await registrar(nuevoEstudiante())).json();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/usuarios/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().correo).toBe("camila.rojas@duocuc.cl");
  });

  it("un token de renovación no sirve como token de acceso", async () => {
    const { refreshToken } = (await registrar(nuevoEstudiante())).json();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/usuarios/me",
      headers: { authorization: `Bearer ${refreshToken}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/renovar entrega tokens nuevos y rechaza un token de acceso", async () => {
    const { accessToken, refreshToken } = (await registrar(nuevoEstudiante())).json();
    const ok = await app.inject({ method: "POST", url: "/api/v1/auth/renovar", payload: { refreshToken } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().accessToken).toBeTypeOf("string");

    const mal = await app.inject({ method: "POST", url: "/api/v1/auth/renovar", payload: { refreshToken: accessToken } });
    expect(mal.statusCode).toBe(401);
  });

  it("GET /usuarios responde 403 a un estudiante y 200 a un administrador (RNF-B06)", async () => {
    const { accessToken: tokenEstudiante } = (await registrar(nuevoEstudiante())).json();
    const comoEstudiante = await app.inject({
      method: "GET",
      url: "/api/v1/usuarios",
      headers: { authorization: `Bearer ${tokenEstudiante}` },
    });
    expect(comoEstudiante.statusCode).toBe(403);
    expect(comoEstudiante.json().error.codigo).toBe("SIN_PERMISO");

    const admin = (await registrar(nuevoEstudiante({ correo: "coordinacion@duocuc.cl" }))).json();
    await db.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [admin.user.id]);
    const comoAdmin = await app.inject({
      method: "GET",
      url: "/api/v1/usuarios?rol=student",
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(comoAdmin.statusCode).toBe(200);
    expect(comoAdmin.json()).toHaveLength(1);
  });
});

describe("DELETE /api/v1/usuarios/me", () => {
  it("elimina la cuenta y el token deja de servir", async () => {
    const { accessToken } = (await registrar(nuevoEstudiante())).json();
    const auth = { authorization: `Bearer ${accessToken}` };
    const res = await app.inject({ method: "DELETE", url: "/api/v1/usuarios/me", headers: auth });
    expect(res.statusCode).toBe(204);

    const { rows } = await db.query("SELECT count(*)::int AS n FROM usuarios");
    expect(rows[0].n).toBe(0);
    const despues = await app.inject({ method: "GET", url: "/api/v1/usuarios/me", headers: auth });
    expect(despues.statusCode).toBe(401);
  });
});

describe("CORS (app web en http://localhost:8081)", () => {
  it("permite DELETE con Authorization desde el origen de la app", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/usuarios/me",
      headers: {
        origin: "http://localhost:8081",
        "access-control-request-method": "DELETE",
        "access-control-request-headers": "authorization",
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
    expect(String(res.headers["access-control-allow-methods"])).toContain("DELETE");
    expect(String(res.headers["access-control-allow-headers"]).toLowerCase()).toContain("authorization");
  });

  it("no autoriza otros orígenes", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/usuarios/me",
      headers: { origin: "https://sitio-malicioso.com", "access-control-request-method": "DELETE" },
    });
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("formato de errores", () => {
  it("una ruta inexistente responde con el formato común", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/no-existe" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { codigo: "NO_ENCONTRADO", mensaje: "El recurso no existe." } });
  });

  it("GET /health responde ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.json()).toEqual({ status: "ok" });
  });
});
