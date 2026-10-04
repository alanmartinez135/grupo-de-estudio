// Error que entrega el cliente cuando una solicitud falla.
// `codigo` es el identificador estable del API (o "SIN_CONEXION" si no hubo respuesta)
// y `message` es el texto para mostrar al usuario.
export class ApiRequestError extends Error {
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "ApiRequestError";
    this.status = status;
    this.codigo = codigo;
  }
}

export const sinConexion = () =>
  new ApiRequestError(0, "SIN_CONEXION", "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
