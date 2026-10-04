import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Vitest resuelve los paquetes distinto que Node + tsx (como corre el servidor real).
// Esta prueba importa los esquemas compartidos igual que el servidor, para detectar
// errores como un paquete que Node interpreta como CommonJS.
const apiDir = fileURLToPath(new URL("..", import.meta.url));

describe("importaciones en tiempo de ejecución", () => {
  it("Node + tsx pueden importar los esquemas de @grupo-estudio/types", () => {
    const out = execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        "const m = await import('@grupo-estudio/types'); console.log([typeof m.LoginInputSchema, typeof m.RegisterInputSchema, typeof m.ApiErrorSchema].join(','))",
      ],
      { cwd: apiDir, encoding: "utf8" },
    );
    expect(out.trim()).toBe("object,object,object");
  });
});
