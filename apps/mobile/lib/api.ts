import { createApiClient, ApiRequestError } from "@grupo-estudio/api";
import { tokenStore } from "./session";
import { tr, translateServerMessage } from "./i18n";

// URL del API según el entorno (ver apps/mobile/.env.example).
// En web basta con localhost; en un teléfono hay que usar la IP del computador en la red.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createApiClient({ baseUrl: API_URL, tokens: tokenStore });

// Convierte cualquier error en un mensaje para mostrar en pantalla.
// Los mensajes del servidor llegan en español; si la app está en inglés se traducen.
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return translateServerMessage(error.message);
  return tr("common.unexpectedError");
}
