"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

function back(kind: "success" | "error", message: string): never {
  redirect(`/comunidad?${kind}=${encodeURIComponent(message)}`);
}

/** Ejecuta la llamada, y vuelve a /comunidad con un aviso de éxito o con el motivo del error. */
async function run(action: () => Promise<unknown>, failure: string, success: string) {
  try {
    await action();
  } catch (error) {
    back("error", error instanceof ApiError ? error.message : failure);
  }
  revalidatePath("/comunidad");
  back("success", success);
}

export async function joinOpenMatch(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("matchId"));
  if (!id) return;
  await run(() => apiFetch(`/api/open-matches/${id}/join`, { method: "POST", token: session.token }), "No se pudo enviar la solicitud", "Solicitud enviada. El organizador la revisará.");
}

export async function enrollTournament(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("tournamentId"));
  if (!id) return;
  await run(() => apiFetch(`/api/tournaments/${id}/enroll`, { method: "POST", token: session.token }), "No se pudo completar la inscripción", "¡Inscripción realizada!");
}

export async function createOpenMatch(formData: FormData) {
  const session = await requireSession();
  const bookingId = Number(formData.get("bookingId"));
  const maxPlayers = Number(formData.get("maxPlayers"));
  const note = String(formData.get("note") ?? "").trim();
  if (!bookingId || maxPlayers < 2) back("error", "Elige una reserva y al menos 2 jugadores");
  await run(
    () => apiFetch("/api/open-matches", { method: "POST", token: session.token, body: { bookingId, maxPlayers, note: note || undefined } }),
    "No se pudo publicar el partido",
    "Partido publicado. Ya pueden pedir unirse.",
  );
}

export async function respondJoinRequest(formData: FormData) {
  const session = await requireSession();
  const matchId = Number(formData.get("matchId"));
  const requestId = Number(formData.get("requestId"));
  const decision = String(formData.get("decision"));
  if (!matchId || !requestId || !["accept", "reject"].includes(decision)) return;
  await run(
    () => apiFetch(`/api/open-matches/${matchId}/requests/${requestId}/${decision}`, { method: "PATCH", token: session.token }),
    "No se pudo responder la solicitud",
    decision === "accept" ? "Jugador aceptado." : "Solicitud rechazada.",
  );
}
