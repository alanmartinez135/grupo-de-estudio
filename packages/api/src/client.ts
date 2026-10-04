import type { ApiError, AuthResponse, LoginInput, RegisterInput, User } from "@grupo-estudio/types";
import { ApiRequestError, sinConexion } from "./errors";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Dónde se guardan los tokens. La app decide: almacenamiento seguro en móvil, memoria en web.
export interface TokenStore {
  get(): Promise<Tokens | null>;
  set(tokens: Tokens | null): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string; // por ejemplo http://192.168.1.10:3000 (sin /api/v1)
  tokens: TokenStore;
  timeoutMs?: number;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // adjunta el token de acceso y lo renueva si expiró
}

// Punto de salida único de la app hacia el servidor (ver diagrama de componentes).
export function createApiClient({ baseUrl, tokens, timeoutMs = 10000 }: ApiClientOptions) {
  const root = `${baseUrl.replace(/\/+$/, "")}/api/v1`;
  let onSessionExpired: (() => void) | undefined;
  let refreshing: Promise<boolean> | null = null;

  async function send(path: string, { method = "GET", body, auth = false }: RequestOptions, accessToken?: string) {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(`${root}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw sinConexion();
    } finally {
      clearTimeout(timer);
    }
  }

  async function parse<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as T;
    const data = (await res.json().catch(() => null)) as unknown;
    if (res.ok) return data as T;
    const error = (data as ApiError | null)?.error;
    throw new ApiRequestError(
      res.status,
      error?.codigo ?? "ERROR_DESCONOCIDO",
      error?.mensaje ?? "Ocurrió un error inesperado. Inténtalo más tarde.",
    );
  }

  // Pide tokens nuevos con el token de renovación. Si varias solicitudes vencen
  // a la vez, comparten una sola renovación.
  function refresh(): Promise<boolean> {
    refreshing ??= (async () => {
      const current = await tokens.get();
      if (!current) return false;
      // Si no hay conexión, send() lanza SIN_CONEXION y la sesión guardada se conserva.
      const res = await send("/auth/renovar", { method: "POST", body: { refreshToken: current.refreshToken } });
      if (!res.ok) return false;
      const data = await parse<AuthResponse>(res);
      await tokens.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let res = await send(path, options, (await tokens.get())?.accessToken);
    // Sesión expirada: se intenta renovar una vez y repetir la solicitud (punto 5 del 4.6).
    if (res.status === 401 && options.auth) {
      if (await refresh()) {
        res = await send(path, options, (await tokens.get())?.accessToken);
      }
      if (res.status === 401) {
        await tokens.set(null);
        onSessionExpired?.();
      }
    }
    return parse<T>(res);
  }

  async function saveSession(data: AuthResponse): Promise<User> {
    await tokens.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.user;
  }

  return {
    // La app registra aquí qué hacer cuando la sesión ya no se puede renovar.
    setOnSessionExpired(handler: () => void) {
      onSessionExpired = handler;
    },

    auth: {
      async register(input: RegisterInput): Promise<User> {
        return saveSession(await request<AuthResponse>("/auth/registro", { method: "POST", body: input }));
      },
      async login(input: LoginInput): Promise<User> {
        return saveSession(await request<AuthResponse>("/auth/login", { method: "POST", body: input }));
      },
      async logout(): Promise<void> {
        await tokens.set(null);
      },
      // Al abrir la app: si hay una sesión guardada, la renueva y devuelve el usuario.
      // Sin conexión devuelve null pero conserva los tokens para el próximo intento.
      async restoreSession(): Promise<User | null> {
        if (!(await tokens.get())) return null;
        try {
          if (!(await refresh())) {
            await tokens.set(null);
            return null;
          }
          return await request<User>("/usuarios/me", { auth: true });
        } catch (error) {
          if (error instanceof ApiRequestError && error.codigo === "SIN_CONEXION") return null;
          throw error;
        }
      },
    },

    users: {
      me: () => request<User>("/usuarios/me", { auth: true }),
      deleteMe: () => request<void>("/usuarios/me", { method: "DELETE", auth: true }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
