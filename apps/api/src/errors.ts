import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import type { ApiError } from "@grupo-estudio/types";
import { ZodError } from "zod";

// Error de negocio con estado HTTP, código estable y mensaje para el usuario.
export class AppError extends Error {
  readonly statusCode: number;
  readonly codigo: string;

  constructor(statusCode: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.statusCode = statusCode;
    this.codigo = codigo;
  }
}

export const credencialesInvalidas = () =>
  // Mismo mensaje para correo inexistente y contraseña incorrecta (hallazgo H1).
  new AppError(401, "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos.");
export const noAutenticado = () => new AppError(401, "NO_AUTENTICADO", "Tu sesión expiró. Inicia sesión de nuevo.");
export const sinPermiso = () => new AppError(403, "SIN_PERMISO", "No tienes permiso para realizar esta acción.");

function body(codigo: string, mensaje: string): ApiError {
  return { error: { codigo, mensaje } };
}

// Traduce cualquier error al formato único { error: { codigo, mensaje } }.
export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(body(error.codigo, error.message));
  }
  if (error instanceof ZodError) {
    const mensaje = error.issues[0]?.message ?? "Datos inválidos.";
    return reply.status(400).send(body("DATOS_INVALIDOS", mensaje));
  }
  const status = (error as FastifyError).statusCode ?? 500;
  if (status === 429) {
    return reply.status(429).send(body("DEMASIADOS_INTENTOS", "Demasiados intentos. Espera un minuto e inténtalo de nuevo."));
  }
  if (status === 401) {
    return reply.status(401).send(body("NO_AUTENTICADO", "Tu sesión expiró. Inicia sesión de nuevo."));
  }
  if (status >= 400 && status < 500) {
    return reply.status(status).send(body("SOLICITUD_INVALIDA", "La solicitud no es válida."));
  }
  request.log.error(error);
  return reply.status(500).send(body("ERROR_INTERNO", "Ocurrió un error inesperado. Inténtalo más tarde."));
}
