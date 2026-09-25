import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export type ApiFieldError = {
  field: string;
  message: string;
  rejectedValue?: unknown;
};

export type ApiErrorBody = {
  status: number;
  error: string;
  message: string;
  fieldErrors?: ApiFieldError[];
};

/** Error tipado que envuelve una respuesta de error del backend Spring. */
export class ApiError extends Error {
  status: number;
  fieldErrors?: ApiFieldError[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.fieldErrors = body.fieldErrors;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

/**
 * Wrapper de fetch hacia court-reservation-api. Solo se usa en el servidor
 * (Server Actions / Server Components) — API_URL no lleva NEXT_PUBLIC_.
 */
export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...init }: ApiFetchOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data ?? {
        status: response.status,
        error: response.statusText,
        message: [401, 403].includes(response.status)
          ? "Tu sesión ya no es válida. Cierra sesión e inicia sesión de nuevo."
          : "No se pudo conectar con el servidor. Intenta de nuevo.",
      }
    );
  }

  return data as T;
}
