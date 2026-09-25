"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function joinOpenMatch(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = Number(formData.get("matchId"));
  if (!id) return;
  try {
    await apiFetch(`/api/open-matches/${id}/join`, { method: "POST", token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  revalidatePath("/comunidad");
}

export async function enrollTournament(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = Number(formData.get("tournamentId"));
  if (!id) return;
  try {
    await apiFetch(`/api/tournaments/${id}/enroll`, { method: "POST", token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  revalidatePath("/comunidad");
}

export async function createOpenMatch(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const bookingId = Number(formData.get("bookingId"));
  const maxPlayers = Number(formData.get("maxPlayers"));
  const note = String(formData.get("note") ?? "").trim();
  if (!bookingId || maxPlayers < 2) return;
  try { await apiFetch("/api/open-matches", { method: "POST", token: session.token, body: { bookingId, maxPlayers, note: note || undefined } }); }
  catch (error) { if (!(error instanceof ApiError)) throw error; }
  revalidatePath("/comunidad");
}

export async function respondJoinRequest(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const matchId = Number(formData.get("matchId"));
  const requestId = Number(formData.get("requestId"));
  const decision = String(formData.get("decision"));
  if (!matchId || !requestId || !["accept", "reject"].includes(decision)) return;
  try {
    await apiFetch(`/api/open-matches/${matchId}/requests/${requestId}/${decision}`, { method: "PATCH", token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  revalidatePath("/comunidad");
}
