import type { FastifyInstance } from "fastify";
import {
  AnswersInputSchema,
  type DiagnosticResult,
  type DiagnosticTest,
  type TestResult,
  type User,
  type WeeklyTestDetail,
  type WeeklyTestSummary,
} from "@grupo-estudio/types";
import { z } from "zod";
import type { Db } from "../db/pool";
import { AppError } from "../errors";
import { makeAuthHooks } from "../auth/tokens";
import { findById, publicUser } from "../users/repository";
import { buildDiagnosticResult, grade } from "./scoring";
import {
  diagnosticoRendido,
  findDiagnostic,
  findDiagnosticResult,
  findWeeklyTestForUser,
  listWeeklyTests,
  questionsOf,
  saveDiagnosticResult,
  saveTestResult,
  testNoExiste,
  toPublicQuestion,
} from "./repository";

function testIdFrom(params: unknown): string {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(params);
  if (!parsed.success) throw testNoExiste();
  return parsed.data.id;
}

const sinDiagnostico = () => new AppError(404, "SIN_DIAGNOSTICO", "Aún no rindes la evaluación diagnóstica.");

export async function evaluationRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const { authenticate } = makeAuthHooks(db);
  app.addHook("preHandler", authenticate);

  // ------------------------------------------------------------ diagnóstico

  // GET /api/v1/diagnostico — preguntas de la evaluación diagnóstica (sin respuestas correctas).
  app.get("/diagnostico", async (): Promise<DiagnosticTest> => {
    const diagnostic = await findDiagnostic(db);
    if (!diagnostic) throw new AppError(404, "SIN_DIAGNOSTICO_PUBLICADO", "No hay una evaluación diagnóstica disponible.");
    const questions = await questionsOf(db, diagnostic.id);
    return { ...diagnostic, questions: questions.map(toPublicQuestion) };
  });

  // POST /api/v1/diagnostico/respuestas — califica, guarda el resultado y asigna el nivel.
  app.post("/diagnostico/respuestas", async (request): Promise<{ result: DiagnosticResult; user: User }> => {
    const { answers } = AnswersInputSchema.parse(request.body);
    const userId = request.currentUser!.id;
    if (await findDiagnosticResult(db, userId)) throw diagnosticoRendido();

    const diagnostic = await findDiagnostic(db);
    if (!diagnostic) throw new AppError(404, "SIN_DIAGNOSTICO_PUBLICADO", "No hay una evaluación diagnóstica disponible.");
    const questions = await questionsOf(db, diagnostic.id);
    const result = buildDiagnosticResult(questions, grade(questions, answers), new Date());

    await saveDiagnosticResult(db, { evaluationId: diagnostic.id, userId, answers, result });
    const user = await findById(db, userId);
    return { result, user: publicUser(user!) };
  });

  // GET /api/v1/diagnostico/resultado — último resultado del estudiante.
  app.get("/diagnostico/resultado", async (request): Promise<DiagnosticResult> => {
    const result = await findDiagnosticResult(db, request.currentUser!.id);
    if (!result) throw sinDiagnostico();
    return result;
  });

  // ------------------------------------------------------------ tests semanales

  // GET /api/v1/tests — tests de los niveles de los grupos del estudiante, con su estado.
  app.get("/tests", async (request): Promise<WeeklyTestSummary[]> => listWeeklyTests(db, request.currentUser!.id));

  // GET /api/v1/tests/:id — test con sus preguntas (sin respuestas correctas, H5).
  app.get("/tests/:id", async (request): Promise<WeeklyTestDetail> => {
    const summary = await findWeeklyTestForUser(db, request.currentUser!.id, testIdFrom(request.params));
    const questions = await questionsOf(db, summary.id);
    return { ...summary, questions: questions.map(toPublicQuestion) };
  });

  // POST /api/v1/tests/:id/respuestas — califica en el servidor y guarda el resultado.
  app.post("/tests/:id/respuestas", async (request): Promise<TestResult> => {
    const { answers } = AnswersInputSchema.parse(request.body);
    const userId = request.currentUser!.id;
    const summary = await findWeeklyTestForUser(db, userId, testIdFrom(request.params));
    if (summary.status === "completed") throw new AppError(409, "TEST_COMPLETADO", "Ya completaste este test.");

    const questions = await questionsOf(db, summary.id);
    const g = grade(questions, answers);
    await saveTestResult(db, { testId: summary.id, userId, answers, correct: g.correct, total: g.total, score: g.score });
    return { correct: g.correct, total: g.total, score: g.score };
  });
}
