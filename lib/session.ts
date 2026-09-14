import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";
// 24h: debe coincidir con app.security.jwt.expiration en application.yml del backend.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export type SessionPayload = {
  token: string;
  name: string;
  role: string;
  userId: number;
  email: string;
};

/** Crea la cookie de sesion (httpOnly) a partir de la respuesta de /api/auth. */
export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Lee la sesion actual desde la cookie. Devuelve null si no hay sesion o esta corrupta. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.token === "string" &&
      typeof parsed?.name === "string" &&
      typeof parsed?.userId === "number"
    ) {
      return parsed as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
