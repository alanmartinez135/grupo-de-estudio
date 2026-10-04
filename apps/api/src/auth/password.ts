import { hash, verify } from "@node-rs/argon2";

// Argon2id (algoritmo por defecto de @node-rs/argon2) con los parámetros
// recomendados por OWASP: 19 MiB de memoria y 2 iteraciones (RNF-B04).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Hash de relleno: cuando el correo no existe se verifica contra este hash igual,
// para que la respuesta tarde lo mismo y no revele qué correos están registrados (H1).
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("contraseña-de-relleno-no-usada");
  return dummyHash;
}
