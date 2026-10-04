import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/auth/password";

// Pruebas unitarias del almacenamiento de contraseñas (RNF-B04).
describe("hash de contraseñas", () => {
  it("nunca guarda la contraseña en texto plano y usa Argon2id", async () => {
    const hash = await hashPassword("clave-segura-123");
    expect(hash).not.toContain("clave-segura-123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("acepta la contraseña correcta y rechaza una incorrecta", async () => {
    const hash = await hashPassword("clave-segura-123");
    expect(await verifyPassword(hash, "clave-segura-123")).toBe(true);
    expect(await verifyPassword(hash, "otra-clave")).toBe(false);
  });

  it("genera hashes distintos para la misma contraseña (sal aleatoria)", async () => {
    const [a, b] = await Promise.all([hashPassword("misma-clave-1"), hashPassword("misma-clave-1")]);
    expect(a).not.toBe(b);
  });

  it("devuelve false ante un hash corrupto en vez de lanzar un error", async () => {
    expect(await verifyPassword("no-es-un-hash", "x")).toBe(false);
  });
});
