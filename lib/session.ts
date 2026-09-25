import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

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

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${serialized}.${sign(serialized)}`;
}

function decodeSession(value: string): SessionPayload | null {
  const [serialized, signature, ...extraParts] = value.split(".");
  if (!serialized || !signature || extraParts.length > 0) return null;

  const expectedSignature = sign(serialized);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(serialized, "base64url").toString("utf8"));
    if (
      typeof parsed?.token === "string" &&
      typeof parsed?.name === "string" &&
      typeof parsed?.role === "string" &&
      typeof parsed?.userId === "number" &&
      typeof parsed?.email === "string"
    ) {
      return parsed as SessionPayload;
    }
  } catch {
    // Cookie corrupta: se trata como una sesión inexistente.
  }
  return null;
}

/** Crea la cookie de sesion (httpOnly) a partir de la respuesta de /api/auth. */
export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(payload), {
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

  return decodeSession(raw);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
