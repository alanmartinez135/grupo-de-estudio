import { describe, expect, it } from "vitest";
import { buildDiagnosticResult, grade, levelFromScore, type GradableQuestion } from "../src/evaluations/scoring";

// Pruebas unitarias del cálculo de puntaje, nivel y recomendaciones (sin base de datos).
const Q: GradableQuestion[] = [
  { id: "r1", skill: "reading", competency: "Vocabulario", correctIndex: 0 },
  { id: "r2", skill: "reading", competency: "Vocabulario", correctIndex: 1 },
  { id: "w1", skill: "writing", competency: "Gramática", correctIndex: 2 },
  { id: "w2", skill: "writing", competency: "Gramática", correctIndex: 3 },
];

describe("grade", () => {
  it("cuenta aciertos y calcula el porcentaje", () => {
    const g = grade(Q, { r1: 0, r2: 1, w1: 0, w2: 0 });
    expect(g).toMatchObject({ correct: 2, total: 4, score: 50 });
    expect(g.byQuestion).toEqual({ r1: true, r2: true, w1: false, w2: false });
  });

  it("exige responder todas las preguntas", () => {
    expect(() => grade(Q, { r1: 0 })).toThrowError("Responde todas las preguntas antes de enviar.");
  });
});

describe("levelFromScore", () => {
  it.each([
    [0, "A1"], [29, "A1"], [30, "A2"], [49, "A2"], [50, "B1"], [69, "B1"],
    [70, "B2"], [84, "B2"], [85, "C1"], [94, "C1"], [95, "C2"], [100, "C2"],
  ])("%i %% → %s", (score, level) => {
    expect(levelFromScore(score)).toBe(level);
  });
});

describe("buildDiagnosticResult", () => {
  it("separa fortalezas y aspectos a reforzar por competencia y recomienda según lo débil", () => {
    const g = grade(Q, { r1: 0, r2: 1, w1: 0, w2: 0 }); // vocabulario 100 %, gramática 0 %
    const r = buildDiagnosticResult(Q, g, new Date("2026-10-04T12:00:00Z"));
    expect(r.level).toBe("B1");
    expect(r.competencies).toEqual([
      { name: "Vocabulario", skill: "reading", score: 100 },
      { name: "Gramática", skill: "writing", score: 0 },
    ]);
    expect(r.strengths).toEqual(["Vocabulario"]);
    expect(r.weaknesses).toEqual(["Gramática"]);
    expect(r.recommendations[0]).toContain("tiempos verbales");
    expect(r.recommendations.at(-1)).toContain("nivel B1");
    expect(r.completedAt).toBe("2026-10-04T12:00:00.000Z");
  });

  it("con todo correcto no deja aspectos a reforzar y recomienda subir el desafío", () => {
    const r = buildDiagnosticResult(Q, grade(Q, { r1: 0, r2: 1, w1: 2, w2: 3 }), new Date());
    expect(r.level).toBe("C2");
    expect(r.weaknesses).toEqual([]);
    expect(r.recommendations[0]).toContain("nivel más alto");
  });
});
