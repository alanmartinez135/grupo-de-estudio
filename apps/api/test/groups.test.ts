import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Db } from "../src/db/pool";
import { crearEstudiante, createTestApp, resetDb } from "./helpers";

// Pruebas de integración de los grupos de estudio contra PostgreSQL de pruebas.
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

type Headers = { authorization: string };
const crearGrupo = (headers: Headers, body: Record<string, unknown> = { name: "English Warriors", description: "Writing B1", level: "B1" }) =>
  app.inject({ method: "POST", url: "/api/v1/grupos", headers, payload: body });
const unirse = (headers: Headers, groupId: string) =>
  app.inject({ method: "POST", url: `/api/v1/grupos/${groupId}/integrantes`, headers });

describe("crear y listar grupos", () => {
  it("crea un grupo con código DUOC-#### y deja al creador como integrante", async () => {
    const ana = await crearEstudiante(app, db, "Ana");
    const res = await crearGrupo(ana.headers);
    expect(res.statusCode).toBe(201);
    const grupo = res.json();
    expect(grupo.code).toMatch(/^DUOC-\d{4}$/);
    expect(grupo.createdBy).toBe(ana.id);
    expect(grupo.memberIds).toEqual([ana.id]);
    expect(grupo.members[0]).toEqual({ id: ana.id, name: "Ana 1", career: "Ingeniería en Informática" });
  });

  it("valida los datos del grupo", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await crearGrupo(ana.headers, { name: "  ", level: "B1" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.mensaje).toBe("Ingresa un nombre para el grupo.");
  });

  it("lista los grupos con sus integrantes, el más nuevo primero", async () => {
    const ana = await crearEstudiante(app, db);
    await crearGrupo(ana.headers, { name: "Primero", level: "A2" });
    await crearGrupo(ana.headers, { name: "Segundo", level: "B2" });
    const res = await app.inject({ method: "GET", url: "/api/v1/grupos", headers: ana.headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().map((g: { name: string }) => g.name)).toEqual(["Segundo", "Primero"]);
  });

  it("exige sesión", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/grupos" });
    expect(res.statusCode).toBe(401);
  });

  it("responde 404 para un grupo inexistente o un id mal formado", async () => {
    const ana = await crearEstudiante(app, db);
    for (const id of ["00000000-0000-4000-8000-000000000000", "g-1"]) {
      const res = await app.inject({ method: "GET", url: `/api/v1/grupos/${id}`, headers: ana.headers });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.codigo).toBe("GRUPO_NO_EXISTE");
    }
  });
});

describe("unirse a un grupo", () => {
  it("se une con el código de invitación (sin importar mayúsculas)", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/grupos/unirse",
      headers: beto.headers,
      payload: { code: grupo.code.toLowerCase() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().memberIds).toEqual([ana.id, beto.id]);
  });

  it("rechaza un código inexistente o con formato incorrecto", async () => {
    const beto = await crearEstudiante(app, db);
    const noExiste = await app.inject({ method: "POST", url: "/api/v1/grupos/unirse", headers: beto.headers, payload: { code: "DUOC-0000" } });
    expect(noExiste.statusCode).toBe(404);
    expect(noExiste.json().error.codigo).toBe("CODIGO_INVALIDO");
    const formato = await app.inject({ method: "POST", url: "/api/v1/grupos/unirse", headers: beto.headers, payload: { code: "hola" } });
    expect(formato.statusCode).toBe(400);
  });

  it("no permite unirse dos veces", async () => {
    const ana = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    const res = await unirse(ana.headers, grupo.id);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.codigo).toBe("YA_ES_INTEGRANTE");
  });

  it("no permite superar los 6 integrantes", async () => {
    const creador = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(creador.headers)).json();
    for (let i = 0; i < 5; i++) expect((await unirse((await crearEstudiante(app, db)).headers, grupo.id)).statusCode).toBe(200);
    const septimo = await unirse((await crearEstudiante(app, db)).headers, grupo.id);
    expect(septimo.statusCode).toBe(409);
    expect(septimo.json().error.codigo).toBe("GRUPO_LLENO");
  });

  it("H3: con 10 solicitudes simultáneas por el último cupo, solo entra una (RNF-B09)", async () => {
    const creador = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(creador.headers)).json();
    for (let i = 0; i < 4; i++) await unirse((await crearEstudiante(app, db)).headers, grupo.id); // 5 integrantes

    const candidatos = await Promise.all(Array.from({ length: 10 }, () => crearEstudiante(app, db)));
    const respuestas = await Promise.all(candidatos.map((c) => unirse(c.headers, grupo.id)));

    expect(respuestas.filter((r) => r.statusCode === 200)).toHaveLength(1);
    expect(respuestas.filter((r) => r.statusCode === 409)).toHaveLength(9);
    const { rows } = await db.query("SELECT count(*)::int AS n FROM grupo_integrantes WHERE grupo_id = $1", [grupo.id]);
    expect(rows[0].n).toBe(6);
  });
});

describe("abandonar un grupo", () => {
  it("quita al integrante y conserva el grupo si quedan otros", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    await unirse(beto.headers, grupo.id);

    const res = await app.inject({ method: "DELETE", url: `/api/v1/grupos/${grupo.id}/integrantes/me`, headers: beto.headers });
    expect(res.statusCode).toBe(204);
    const detalle = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}`, headers: ana.headers });
    expect(detalle.json().memberIds).toEqual([ana.id]);
  });

  it("elimina el grupo cuando se va el último integrante", async () => {
    const ana = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    await app.inject({ method: "DELETE", url: `/api/v1/grupos/${grupo.id}/integrantes/me`, headers: ana.headers });
    const detalle = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}`, headers: ana.headers });
    expect(detalle.statusCode).toBe(404);
  });

  it("responde 409 si no pertenece al grupo", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    const res = await app.inject({ method: "DELETE", url: `/api/v1/grupos/${grupo.id}/integrantes/me`, headers: beto.headers });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.codigo).toBe("NO_ES_INTEGRANTE");
  });

  it("al eliminar la cuenta, el usuario sale de sus grupos", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = (await crearGrupo(ana.headers)).json();
    await unirse(beto.headers, grupo.id);
    await app.inject({ method: "DELETE", url: "/api/v1/usuarios/me", headers: beto.headers });
    const detalle = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}`, headers: ana.headers });
    expect(detalle.json().memberIds).toEqual([ana.id]);
  });
});
