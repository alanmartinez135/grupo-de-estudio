import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Db } from "../src/db/pool";
import { DIAGNOSTICO, TESTS_SEMANALES } from "../src/content/evaluaciones";
import { crearEstudiante, createTestApp, resetDb } from "./helpers";

// Pruebas de integración de la evaluación diagnóstica y los tests semanales.
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
const respuestasCorrectas = (questions: { id: string; correctIndex: number }[]) =>
  Object.fromEntries(questions.map((q) => [q.id, q.correctIndex]));
const respuestasIncorrectas = (questions: { id: string; correctIndex: number }[]) =>
  Object.fromEntries(questions.map((q) => [q.id, q.correctIndex === 0 ? 1 : 0]));

async function grupoDeNivel(headers: Headers, level: string) {
  const res = await app.inject({ method: "POST", url: "/api/v1/grupos", headers, payload: { name: `Grupo ${level}`, level } });
  return res.json();
}

describe("evaluación diagnóstica", () => {
  it("entrega las preguntas sin la respuesta correcta (H5)", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({ method: "GET", url: "/api/v1/diagnostico", headers: ana.headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().questions).toHaveLength(DIAGNOSTICO.questions.length);
    expect(res.body).not.toContain("correctIndex");
    expect(res.body).not.toContain("indice_correcto");
  });

  it("califica en el servidor, asigna el nivel y lo guarda en el usuario", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/diagnostico/respuestas",
      headers: ana.headers,
      payload: { answers: respuestasCorrectas(DIAGNOSTICO.questions) },
    });
    expect(res.statusCode).toBe(200);
    const { result, user } = res.json();
    expect(result).toMatchObject({ overallScore: 100, level: "C2", correct: 12, total: 12, weaknesses: [] });
    expect(user.englishLevel).toBe("C2");

    const guardado = await app.inject({ method: "GET", url: "/api/v1/diagnostico/resultado", headers: ana.headers });
    expect(guardado.json().overallScore).toBe(100);
  });

  it("con todo incorrecto asigna A1 y lista todas las competencias a reforzar", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/diagnostico/respuestas",
      headers: ana.headers,
      payload: { answers: respuestasIncorrectas(DIAGNOSTICO.questions) },
    });
    const { result } = res.json();
    expect(result.level).toBe("A1");
    expect(result.weaknesses.sort()).toEqual(["Comprensión lectora", "Conectores", "Gramática", "Vocabulario"]);
  });

  it("rechaza respuestas incompletas y no permite rendirlo dos veces", async () => {
    const ana = await crearEstudiante(app, db);
    const incompleto = await app.inject({
      method: "POST",
      url: "/api/v1/diagnostico/respuestas",
      headers: ana.headers,
      payload: { answers: { [DIAGNOSTICO.questions[0]!.id]: 0 } },
    });
    expect(incompleto.statusCode).toBe(400);
    expect(incompleto.json().error.codigo).toBe("RESPUESTAS_INCOMPLETAS");

    const payload = { answers: respuestasCorrectas(DIAGNOSTICO.questions) };
    expect((await app.inject({ method: "POST", url: "/api/v1/diagnostico/respuestas", headers: ana.headers, payload })).statusCode).toBe(200);
    const segunda = await app.inject({ method: "POST", url: "/api/v1/diagnostico/respuestas", headers: ana.headers, payload });
    expect(segunda.statusCode).toBe(409);
    expect(segunda.json().error.codigo).toBe("DIAGNOSTICO_RENDIDO");
  });

  it("responde 404 si aún no hay resultado", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({ method: "GET", url: "/api/v1/diagnostico/resultado", headers: ana.headers });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.codigo).toBe("SIN_DIAGNOSTICO");
  });
});

describe("tests semanales", () => {
  const testB1 = TESTS_SEMANALES.filter((t) => t.level === "B1");
  const unTestB1 = testB1[0]!;

  it("un estudiante sin grupos no tiene tests", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({ method: "GET", url: "/api/v1/tests", headers: ana.headers });
    expect(res.json()).toEqual([]);
  });

  it("ve los tests del nivel de su grupo, pendientes y con el id del grupo", async () => {
    const ana = await crearEstudiante(app, db);
    const grupo = await grupoDeNivel(ana.headers, "B1");
    const res = await app.inject({ method: "GET", url: "/api/v1/tests", headers: ana.headers });
    const tests = res.json();
    expect(tests.map((t: { id: string }) => t.id).sort()).toEqual(testB1.map((t) => t.id).sort());
    expect(tests[0]).toMatchObject({ status: "pending", score: null, level: "B1", groupIds: [grupo.id] });
    expect(tests[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("entrega el test sin respuestas correctas y lo califica en el servidor (H5)", async () => {
    const ana = await crearEstudiante(app, db);
    await grupoDeNivel(ana.headers, "B1");
    const detalle = await app.inject({ method: "GET", url: `/api/v1/tests/${unTestB1.id}`, headers: ana.headers });
    expect(detalle.statusCode).toBe(200);
    expect(detalle.body).not.toContain("correctIndex");

    const answers = respuestasCorrectas(unTestB1.questions);
    answers[unTestB1.questions[0]!.id] = unTestB1.questions[0]!.correctIndex === 0 ? 1 : 0; // una mala
    const res = await app.inject({ method: "POST", url: `/api/v1/tests/${unTestB1.id}/respuestas`, headers: ana.headers, payload: { answers } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ correct: 2, total: 3, score: 67 });

    const lista = (await app.inject({ method: "GET", url: "/api/v1/tests", headers: ana.headers })).json();
    expect(lista.find((t: { id: string }) => t.id === unTestB1.id)).toMatchObject({ status: "completed", score: 67 });

    const otraVez = await app.inject({ method: "POST", url: `/api/v1/tests/${unTestB1.id}/respuestas`, headers: ana.headers, payload: { answers } });
    expect(otraVez.statusCode).toBe(409);
  });

  it("no permite resolver tests de un nivel que no es el de sus grupos", async () => {
    const ana = await crearEstudiante(app, db);
    await grupoDeNivel(ana.headers, "A1");
    const res = await app.inject({ method: "GET", url: `/api/v1/tests/${unTestB1.id}`, headers: ana.headers });
    expect(res.statusCode).toBe(403);
  });

  it("responde 404 para un test inexistente", async () => {
    const ana = await crearEstudiante(app, db);
    const res = await app.inject({ method: "GET", url: "/api/v1/tests/00000000-0000-4000-8000-000000000000", headers: ana.headers });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.codigo).toBe("TEST_NO_EXISTE");
  });
});
