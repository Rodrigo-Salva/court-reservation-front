"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { CourtResponseDTO } from "@/lib/definitions";
async function sessionAdmin() { const s = await getSession(); if (!s) redirect("/login"); if (!["ADMIN", "SUPER_ADMIN"].includes(s.role)) redirect("/explorar"); return s; }
export async function saveVenue(formData: FormData) { const s = await sessionAdmin(); const id = Number(formData.get("id")); try { await apiFetch(id ? `/api/venues/${id}` : "/api/venues", { method: id ? "PUT" : "POST", token: s.token, body: { name: String(formData.get("name")).trim(), address: String(formData.get("address")).trim(), phone: String(formData.get("phone")).trim() || undefined } }); } catch (e) { const m = e instanceof ApiError ? e.message : "No se pudo guardar la sede"; redirect(`/sedes?error=${encodeURIComponent(m)}`); } revalidatePath("/sedes"); redirect("/sedes?success=1"); }
export async function toggleVenue(formData: FormData) { const s = await sessionAdmin(); const id = Number(formData.get("id")); const active = formData.get("active") === "true"; await apiFetch(active ? `/api/venues/${id}` : `/api/venues/${id}/activate`, { method: active ? "DELETE" : "PATCH", token: s.token }); revalidatePath("/sedes"); }

export async function moveCourt(formData: FormData) {
  const s = await sessionAdmin();
  const courtId = Number(formData.get("courtId"));
  const venueId = Number(formData.get("venueId"));
  if (!courtId || !venueId) redirect(`/sedes?error=${encodeURIComponent("Selecciona la sede de destino")}`);
  try {
    const court = await apiFetch<CourtResponseDTO>(`/api/courts/${courtId}`, { token: s.token });
    await apiFetch(`/api/courts/${courtId}`, {
      method: "PUT",
      token: s.token,
      body: {
        venueId,
        name: court.name,
        sportType: court.sportType,
        capacity: court.capacity,
        basePricePerHour: court.basePricePerHour,
        description: court.description || undefined,
      },
    });
  } catch (e) {
    const m = e instanceof ApiError ? e.message : "No se pudo mover la cancha";
    redirect(`/sedes?error=${encodeURIComponent(m)}`);
  }
  revalidatePath("/sedes");
  revalidatePath("/administracion");
  redirect("/sedes?moved=1");
}
