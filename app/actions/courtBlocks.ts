"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

async function adminSession() { const session = await getSession(); if (!session) redirect("/login"); if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar"); return session; }
export async function createCourtBlock(formData: FormData) { const session = await adminSession(); const courtId = Number(formData.get("courtId")); const date = String(formData.get("date")); try { await apiFetch("/api/court-blocks", { method: "POST", token: session.token, body: { courtId, blockDate: date, startTime: String(formData.get("startTime")), endTime: String(formData.get("endTime")), type: String(formData.get("type")), reason: String(formData.get("reason")).trim() } }); } catch (error) { const message = error instanceof ApiError ? error.message : "No se pudo crear el bloqueo"; redirect(`/bloqueos?courtId=${courtId}&date=${date}&error=${encodeURIComponent(message)}`); } revalidatePath("/bloqueos"); redirect(`/bloqueos?courtId=${courtId}&date=${date}&success=1`); }
export async function removeCourtBlock(formData: FormData) { const session = await adminSession(); const id = Number(formData.get("id")); const courtId = Number(formData.get("courtId")); const date = String(formData.get("date")); if (id) await apiFetch(`/api/court-blocks/${id}`, { method: "DELETE", token: session.token }); revalidatePath("/bloqueos"); redirect(`/bloqueos?courtId=${courtId}&date=${date}`); }
