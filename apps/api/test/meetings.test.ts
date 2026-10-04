import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Db } from "../src/db/pool";
import { crearEstudiante, createTestApp, resetDb } from "./helpers";

// Pruebas de integración de la coordinación de encuentros de estudio.
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
const enHoras = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
const encuentro = (overrides: Record<string, unknown> = {}) => ({
  topic: "Repaso de condicionales",
  startsAt: enHoras(24),
  durationMinutes: 60,
  mode: "presencial",
  location: "Biblioteca, sede San Joaquín",
  ...overrides,
});

async function grupoCon(headers: Headers) {
  return (await app.inject({ method: "POST", url: "/api/v1/grupos", headers, payload: { name: "Grupo", level: "B1" } })).json();
}
const proponer = (headers: Headers, groupId: string, body = encuentro()) =>
  app.inject({ method: "POST", url: `/api/v1/grupos/${groupId}/encuentros`, headers, payload: body });

describe("proponer encuentros", () => {
  it("un integrante propone un encuentro y queda confirmado como asistente", async () => {
    const ana = await crearEstudiante(app, db, "Ana");
    const grupo = await grupoCon(ana.headers);
    const res = await proponer(ana.headers, grupo.id);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      groupId: grupo.id,
      groupName: "Grupo",
      topic: "Repaso de condicionales",
      mode: "presencial",
      createdBy: ana.id,
      myResponse: "yes",
    });
    expect(res.json().attendees.map((a: { id: string }) => a.id)).toEqual([ana.id]);
  });

  it("alguien que no es integrante no puede proponer ni ver encuentros", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    expect((await proponer(beto.headers, grupo.id)).statusCode).toBe(403);
    const ver = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}/encuentros`, headers: beto.headers });
    expect(ver.statusCode).toBe(403);
    expect(ver.json().error.codigo).toBe("NO_ES_INTEGRANTE");
  });

  it.each([
    ["una fecha pasada", { startsAt: enHoras(-1) }, "El encuentro debe ser en el futuro."],
    ["más de 90 días adelante", { startsAt: enHoras(24 * 100) }, "El encuentro puede programarse hasta 90 días adelante."],
    ["online sin enlace https", { mode: "online", location: "por Zoom" }, "Para un encuentro online, ingresa un enlace que empiece con https://"],
    ["sin tema", { topic: " " }, "Ingresa el tema del encuentro."],
    ["duración muy corta", { durationMinutes: 5 }, "La duración mínima es de 15 minutos."],
  ])("rechaza %s", async (_caso, cambio, mensaje) => {
    const ana = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    const res = await proponer(ana.headers, grupo.id, encuentro(cambio));
    expect(res.statusCode).toBe(400);
    expect(res.json().error.mensaje).toBe(mensaje);
  });

  it("acepta un encuentro online con enlace", async () => {
    const ana = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    const res = await proponer(ana.headers, grupo.id, encuentro({ mode: "online", location: "https://meet.example.com/abc" }));
    expect(res.statusCode).toBe(201);
  });
});

describe("listar y asistir", () => {
  it("lista los encuentros del grupo ordenados por fecha, con la respuesta de cada uno", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    await app.inject({ method: "POST", url: `/api/v1/grupos/${grupo.id}/integrantes`, headers: beto.headers });
    await proponer(ana.headers, grupo.id, encuentro({ topic: "Después", startsAt: enHoras(48) }));
    await proponer(ana.headers, grupo.id, encuentro({ topic: "Antes", startsAt: enHoras(2) }));

    const res = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}/encuentros`, headers: beto.headers });
    expect(res.json().map((m: { topic: string }) => m.topic)).toEqual(["Antes", "Después"]);
    expect(res.json()[0].myResponse).toBeNull();
  });

  it("un integrante confirma y luego cambia su asistencia", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    await app.inject({ method: "POST", url: `/api/v1/grupos/${grupo.id}/integrantes`, headers: beto.headers });
    const m = (await proponer(ana.headers, grupo.id)).json();

    const si = await app.inject({ method: "PUT", url: `/api/v1/encuentros/${m.id}/asistencia`, headers: beto.headers, payload: { response: "yes" } });
    expect(si.json().attendees).toHaveLength(2);
    expect(si.json().myResponse).toBe("yes");

    const no = await app.inject({ method: "PUT", url: `/api/v1/encuentros/${m.id}/asistencia`, headers: beto.headers, payload: { response: "no" } });
    expect(no.json().attendees).toHaveLength(1);
    expect(no.json().myResponse).toBe("no");
  });

  it("muestra en próximos encuentros solo los de mis grupos", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupoAna = await grupoCon(ana.headers);
    const grupoBeto = await grupoCon(beto.headers);
    await proponer(ana.headers, grupoAna.id, encuentro({ topic: "De Ana" }));
    await proponer(beto.headers, grupoBeto.id, encuentro({ topic: "De Beto" }));

    const res = await app.inject({ method: "GET", url: "/api/v1/encuentros/proximos", headers: ana.headers });
    expect(res.json().map((m: { topic: string }) => m.topic)).toEqual(["De Ana"]);
  });
});

describe("cancelar encuentros", () => {
  it("solo quien lo propuso puede cancelarlo", async () => {
    const ana = await crearEstudiante(app, db);
    const beto = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    await app.inject({ method: "POST", url: `/api/v1/grupos/${grupo.id}/integrantes`, headers: beto.headers });
    const m = (await proponer(ana.headers, grupo.id)).json();

    const deBeto = await app.inject({ method: "DELETE", url: `/api/v1/encuentros/${m.id}`, headers: beto.headers });
    expect(deBeto.statusCode).toBe(403);
    const deAna = await app.inject({ method: "DELETE", url: `/api/v1/encuentros/${m.id}`, headers: ana.headers });
    expect(deAna.statusCode).toBe(204);
    const lista = await app.inject({ method: "GET", url: `/api/v1/grupos/${grupo.id}/encuentros`, headers: ana.headers });
    expect(lista.json()).toEqual([]);
  });

  it("si el grupo se elimina, sus encuentros también", async () => {
    const ana = await crearEstudiante(app, db);
    const grupo = await grupoCon(ana.headers);
    await proponer(ana.headers, grupo.id);
    await app.inject({ method: "DELETE", url: `/api/v1/grupos/${grupo.id}/integrantes/me`, headers: ana.headers });
    const { rows } = await db.query("SELECT count(*)::int AS n FROM encuentros");
    expect(rows[0].n).toBe(0);
  });
});
