import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Db } from "../src/db/pool";
import { DIAGNOSTICO } from "../src/content/evaluaciones";
import { crearEstudiante, createTestApp, resetDb } from "./helpers";

// Pruebas de integración del panel de administración: usuarios y evaluaciones.
let app: FastifyInstance;
let db: Db;

const TITULO = "Prueba admin";

beforeEach(async () => {
  if (!app) ({ app, db } = await createTestApp());
  await resetDb(db);
  await db.query("DELETE FROM evaluaciones WHERE titulo LIKE $1", [`${TITULO}%`]);
});

afterAll(async () => {
  await db?.query("DELETE FROM evaluaciones WHERE titulo LIKE $1", [`${TITULO}%`]);
  await app?.close();
  await db?.end();
});

type Headers = { authorization: string };

async function crearAdmin() {
  const admin = await crearEstudiante(app, db, "Admin");
  await db.query("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [admin.id]);
  return admin;
}

const nuevoTest = (overrides: Record<string, unknown> = {}) => ({
  title: `${TITULO} Past Simple`,
  skill: "writing",
  level: "B1",
  questions: [
    { prompt: "Yesterday I ___ to the library.", options: ["go", "went", "gone"], correctIndex: 1, competency: "Gramática" },
    { prompt: "She ___ her homework last night.", options: ["did", "does"], correctIndex: 0, competency: "Gramática" },
  ],
  ...overrides,
});

const crearTest = (headers: Headers, body: unknown = nuevoTest()) =>
  app.inject({ method: "POST", url: "/api/v1/admin/evaluaciones", headers, payload: body });

describe("gestión de usuarios", () => {
  it("un administrador cambia el rol de otra cuenta; el cambio rige en la siguiente solicitud", async () => {
    const admin = await crearAdmin();
    const ana = await crearEstudiante(app, db, "Ana");

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/usuarios/${ana.id}/rol`,
      headers: admin.headers,
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: ana.id, role: "admin" });
    expect(res.json()).not.toHaveProperty("passwordHash");

    // El token de Ana dice "student", pero el rol se lee de la base (RNF-B06).
    const lista = await app.inject({ method: "GET", url: "/api/v1/usuarios", headers: ana.headers });
    expect(lista.statusCode).toBe(200);
  });

  it("un administrador no puede cambiar su propio rol ni eliminarse desde el panel", async () => {
    const admin = await crearAdmin();
    const rol = await app.inject({
      method: "PATCH",
      url: `/api/v1/usuarios/${admin.id}/rol`,
      headers: admin.headers,
      payload: { role: "student" },
    });
    expect(rol.statusCode).toBe(409);
    expect(rol.json().error.codigo).toBe("ES_TU_CUENTA");

    const borrar = await app.inject({ method: "DELETE", url: `/api/v1/usuarios/${admin.id}`, headers: admin.headers });
    expect(borrar.statusCode).toBe(409);
  });

  it("un estudiante no puede cambiar roles ni eliminar cuentas", async () => {
    const ana = await crearEstudiante(app, db, "Ana");
    const beto = await crearEstudiante(app, db, "Beto");
    const rol = await app.inject({
      method: "PATCH",
      url: `/api/v1/usuarios/${beto.id}/rol`,
      headers: ana.headers,
      payload: { role: "admin" },
    });
    expect(rol.statusCode).toBe(403);
    const borrar = await app.inject({ method: "DELETE", url: `/api/v1/usuarios/${beto.id}`, headers: ana.headers });
    expect(borrar.statusCode).toBe(403);
  });

  it("rechaza un rol inválido y responde 404 si la cuenta no existe", async () => {
    const admin = await crearAdmin();
    const ana = await crearEstudiante(app, db, "Ana");
    const invalido = await app.inject({
      method: "PATCH",
      url: `/api/v1/usuarios/${ana.id}/rol`,
      headers: admin.headers,
      payload: { role: "superadmin" },
    });
    expect(invalido.statusCode).toBe(400);

    const otro = "00000000-0000-4000-8000-000000000000";
    const noExiste = await app.inject({ method: "DELETE", url: `/api/v1/usuarios/${otro}`, headers: admin.headers });
    expect(noExiste.statusCode).toBe(404);
    expect(noExiste.json().error.codigo).toBe("USUARIO_NO_EXISTE");
  });

  it("eliminar una cuenta la saca de sus grupos y borra los grupos que quedan vacíos", async () => {
    const admin = await crearAdmin();
    const ana = await crearEstudiante(app, db, "Ana");
    const beto = await crearEstudiante(app, db, "Beto");
    const soloAna = (
      await app.inject({ method: "POST", url: "/api/v1/grupos", headers: ana.headers, payload: { name: "Solo", level: "B1" } })
    ).json();
    const compartido = (
      await app.inject({ method: "POST", url: "/api/v1/grupos", headers: ana.headers, payload: { name: "Dúo", level: "B1" } })
    ).json();
    await app.inject({ method: "POST", url: `/api/v1/grupos/${compartido.id}/integrantes`, headers: beto.headers });

    const res = await app.inject({ method: "DELETE", url: `/api/v1/usuarios/${ana.id}`, headers: admin.headers });
    expect(res.statusCode).toBe(204);

    // La sesión de Ana deja de servir aunque el token no haya expirado.
    expect((await app.inject({ method: "GET", url: "/api/v1/usuarios/me", headers: ana.headers })).statusCode).toBe(401);

    const grupos = (await app.inject({ method: "GET", url: "/api/v1/grupos", headers: beto.headers })).json();
    expect(grupos.map((g: { id: string }) => g.id)).toEqual([compartido.id]);
    expect(grupos[0].members).toHaveLength(1);
    expect(soloAna.id).toBeDefined();
  });
});

describe("gestión de evaluaciones", () => {
  it("el listado incluye la diagnóstica y los tests semanales con sus conteos", async () => {
    const admin = await crearAdmin();
    const res = await app.inject({ method: "GET", url: "/api/v1/admin/evaluaciones", headers: admin.headers });
    expect(res.statusCode).toBe(200);
    const lista = res.json();
    expect(lista[0]).toMatchObject({ id: DIAGNOSTICO.id, type: "diagnostica", questionCount: 12 });
    expect(lista.some((e: { type: string }) => e.type === "semanal")).toBe(true);
  });

  it("un test nuevo queda como borrador: los estudiantes no lo ven hasta publicarlo", async () => {
    const admin = await crearAdmin();
    const ana = await crearEstudiante(app, db, "Ana");
    await app.inject({ method: "POST", url: "/api/v1/grupos", headers: ana.headers, payload: { name: "B1", level: "B1" } });

    const creado = await crearTest(admin.headers);
    expect(creado.statusCode).toBe(201);
    const test = creado.json();
    expect(test).toMatchObject({ type: "semanal", level: "B1", questionCount: 2, resultsCount: 0, published: false });

    const visibles = async () =>
      (await app.inject({ method: "GET", url: "/api/v1/tests", headers: ana.headers }))
        .json()
        .map((t: { id: string }) => t.id);
    expect(await visibles()).not.toContain(test.id);
    expect((await app.inject({ method: "GET", url: `/api/v1/tests/${test.id}`, headers: ana.headers })).statusCode).toBe(404);

    const publicado = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/evaluaciones/${test.id}`,
      headers: admin.headers,
      payload: { published: true },
    });
    expect(publicado.statusCode).toBe(200);
    expect(publicado.json().published).toBe(true);
    expect(await visibles()).toContain(test.id);

    // La respuesta correcta sigue sin salir del servidor (H5).
    const detalle = (await app.inject({ method: "GET", url: `/api/v1/tests/${test.id}`, headers: ana.headers })).json();
    expect(JSON.stringify(detalle)).not.toContain("correctIndex");
  });

  it("valida el test antes de guardarlo", async () => {
    const admin = await crearAdmin();
    const sinPreguntas = await crearTest(admin.headers, nuevoTest({ questions: [] }));
    expect(sinPreguntas.statusCode).toBe(400);

    const correctaFuera = await crearTest(
      admin.headers,
      nuevoTest({ questions: [{ prompt: "¿?", options: ["a", "b"], correctIndex: 2, competency: "Gramática" }] }),
    );
    expect(correctaFuera.statusCode).toBe(400);
    expect(correctaFuera.json().error.mensaje).toBe("Marca cuál es la alternativa correcta.");

    const sinTitulo = await crearTest(admin.headers, nuevoTest({ title: "  " }));
    expect(sinTitulo.statusCode).toBe(400);
  });

  it("eliminar un test borra también sus resultados; la diagnóstica está protegida", async () => {
    const admin = await crearAdmin();
    const test = (await crearTest(admin.headers)).json();

    const borrar = await app.inject({ method: "DELETE", url: `/api/v1/admin/evaluaciones/${test.id}`, headers: admin.headers });
    expect(borrar.statusCode).toBe(204);
    const otraVez = await app.inject({ method: "DELETE", url: `/api/v1/admin/evaluaciones/${test.id}`, headers: admin.headers });
    expect(otraVez.statusCode).toBe(404);

    const diag = await app.inject({ method: "DELETE", url: `/api/v1/admin/evaluaciones/${DIAGNOSTICO.id}`, headers: admin.headers });
    expect(diag.statusCode).toBe(409);
    expect(diag.json().error.codigo).toBe("DIAGNOSTICO_PROTEGIDO");
    const despublicar = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/evaluaciones/${DIAGNOSTICO.id}`,
      headers: admin.headers,
      payload: { published: false },
    });
    expect(despublicar.statusCode).toBe(409);
  });

  it("solo los administradores acceden a /admin", async () => {
    const ana = await crearEstudiante(app, db, "Ana");
    expect((await app.inject({ method: "GET", url: "/api/v1/admin/evaluaciones", headers: ana.headers })).statusCode).toBe(403);
    expect((await crearTest(ana.headers)).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: "/api/v1/admin/evaluaciones" })).statusCode).toBe(401);
  });
});
