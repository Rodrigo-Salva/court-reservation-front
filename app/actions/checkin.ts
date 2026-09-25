"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function registerCheckIn(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"].includes(session.role)) redirect("/explorar");
  const bookingId = Number(formData.get("bookingId"));
  const code = String(formData.get("code") ?? "").trim();
  if (!code) redirect("/recepcion?error=Ingresa+el+c%C3%B3digo+de+check-in");
  try {
    if (bookingId) await apiFetch(`/api/bookings/${bookingId}/check-in`, { method: "PUT", token: session.token, body: { code } });
    else await apiFetch("/api/bookings/check-in/scan", { method: "POST", token: session.token, body: { code } });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "No se pudo registrar el check-in";
    redirect(`/recepcion?error=${encodeURIComponent(message)}`);
  }
  redirect("/recepcion?success=1");
}

export async function markNoShow(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"].includes(session.role)) redirect("/explorar");
  const bookingId = Number(formData.get("bookingId"));
  if (!bookingId) return;
  try { await apiFetch(`/api/bookings/${bookingId}/no-show`, { method: "PATCH", token: session.token }); }
  catch (error) { const message = error instanceof ApiError ? error.message : "No se pudo marcar el no-show"; redirect(`/recepcion?error=${encodeURIComponent(message)}`); }
  redirect("/recepcion?success=No-show+registrado");
}

export type ScanResult = { ok: boolean; message: string };

/** Check-in solo con el código leído por la cámara; devuelve un resultado en vez de redirigir para seguir escaneando. */
export async function checkInByCode(code: string): Promise<ScanResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión." };
  if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"].includes(session.role)) return { ok: false, message: "No tienes permiso para registrar ingresos." };
  try {
    const booking = await apiFetch<{ userName?: string; courtName?: string; startTime?: string }>("/api/bookings/check-in/scan", { method: "POST", token: session.token, body: { code } });
    revalidatePath("/recepcion");
    return { ok: true, message: `Ingreso registrado: ${booking.userName ?? "cliente"} · ${booking.courtName ?? "cancha"} ${booking.startTime?.slice(0, 5) ?? ""}`.trim() };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : "No se pudo registrar el ingreso." };
  }
}
