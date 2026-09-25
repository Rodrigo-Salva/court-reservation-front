"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { createSession, deleteSession, getSession } from "@/lib/session";
import type {
  AuthResponseDTO,
  LoginFormState,
  RegisterFormState,
  UserResponseDTO,
} from "@/lib/definitions";

/**
 * AuthResponseDTO no trae el id de usuario (solo token/name/role), pero
 * las rutas de reservas/paquetes/espera lo necesitan. Se resuelve aparte
 * justo despues de autenticar, vía GET /api/users/email/{email}.
 */
async function resolveUserId(email: string, token: string): Promise<number> {
  const user = await apiFetch<UserResponseDTO>(
    `/api/users/email/${encodeURIComponent(email)}`,
    { token }
  );
  return user.id;
}

/** Solo permite redirigir de vuelta a una ruta interna (evita open redirects). */
function safeNext(next: unknown): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/explorar";
}

export async function login(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña" };
  }

  try {
    const auth = await apiFetch<AuthResponseDTO>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const userId = await resolveUserId(email, auth.token);

    await createSession({ ...auth, userId, email });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function register(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    membershipType: String(formData.get("membershipType") ?? "NINGUNA"),
  };
  const password = String(formData.get("password") ?? "");

  try {
    const auth = await apiFetch<AuthResponseDTO>("/api/auth/register", {
      method: "POST",
      body: { ...values, password },
    });
    const userId = await resolveUserId(values.email, auth.token);

    await createSession({ ...auth, userId, email: values.email });
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors = Object.fromEntries(
        (error.fieldErrors ?? []).map((fieldError) => [
          fieldError.field,
          fieldError.message,
        ])
      );
      return {
        error: error.fieldErrors?.length ? undefined : error.message,
        fieldErrors,
        values,
      };
    }
    return {
      error: "No se pudo conectar con el servidor. Intenta de nuevo.",
      values,
    };
  }

  redirect("/explorar");
}

export async function logout() {
  const session = await getSession();
  if (session) {
    try {
      // Revoca el token en el backend; si falla igual se cierra la sesión local.
      await apiFetch("/api/auth/logout", { method: "POST", token: session.token });
    } catch {
      /* Backend no disponible o token ya inválido. */
    }
  }
  await deleteSession();
  redirect("/login");
}
