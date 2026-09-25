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

function back(kind: "error" | "success", message: string): never {
  redirect(`/equipos?${kind}=${encodeURIComponent(message)}`);
}

async function run(action: () => Promise<unknown>, failure: string, success?: string) {
  try {
    await action();
  } catch (error) {
    back("error", error instanceof ApiError ? error.message : failure);
  }
  revalidatePath("/equipos");
  revalidatePath("/notificaciones");
  if (success) back("success", success);
}

export async function createTeam(formData: FormData) {
  const s = await requireSession();
  await run(
    () => apiFetch("/api/teams", { method: "POST", token: s.token, body: { name: String(formData.get("name")).trim(), description: String(formData.get("description") ?? "").trim() || undefined } }),
    "No se pudo crear el equipo",
    "Equipo creado correctamente.",
  );
}

export async function inviteToTeam(formData: FormData) {
  const s = await requireSession();
  const teamId = Number(formData.get("teamId"));
  const email = String(formData.get("email") ?? "").trim();
  if (!teamId || !email) back("error", "Ingresa el email de la persona a invitar");
  await run(
    () => apiFetch(`/api/teams/${teamId}/invitations`, { method: "POST", token: s.token, body: { email } }),
    "No se pudo enviar la invitación",
    `Invitación enviada a ${email}.`,
  );
}

export async function respondTeamInvitation(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  if (!id || !["accept", "decline"].includes(decision)) return;
  await run(
    () => apiFetch(`/api/teams/invitations/${id}/${decision}`, { method: "POST", token: s.token }),
    "No se pudo responder la invitación",
    decision === "accept" ? "Te uniste al equipo." : "Invitación rechazada.",
  );
}

export async function cancelTeamInvitation(formData: FormData) {
  const s = await requireSession();
  const teamId = Number(formData.get("teamId"));
  const id = Number(formData.get("id"));
  if (!teamId || !id) return;
  await run(
    () => apiFetch(`/api/teams/${teamId}/invitations/${id}`, { method: "DELETE", token: s.token }),
    "No se pudo cancelar la invitación",
    "Invitación cancelada.",
  );
}

export async function removeTeamMember(formData: FormData) {
  const s = await requireSession();
  const teamId = Number(formData.get("teamId"));
  const userId = Number(formData.get("userId"));
  if (!teamId || !userId) return;
  await run(
    () => apiFetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE", token: s.token }),
    "No se pudo quitar al integrante",
    "Integrante eliminado del equipo.",
  );
}

export async function leaveTeam(formData: FormData) {
  const s = await requireSession();
  const teamId = Number(formData.get("teamId"));
  if (!teamId) return;
  await run(
    () => apiFetch(`/api/teams/${teamId}/leave`, { method: "DELETE", token: s.token }),
    "No se pudo abandonar el equipo",
    "Abandonaste el equipo.",
  );
}
