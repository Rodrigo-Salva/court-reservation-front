"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export type ReviewState = { error?: string; success?: string } | undefined;
export async function createCourtReview(_previous: ReviewState, formData: FormData): Promise<ReviewState> {
 const session = await getSession(); if (!session) redirect("/login"); const courtId = Number(formData.get("courtId")); const rating = Number(formData.get("rating")); const comment = String(formData.get("comment") ?? "").trim();
 if (!courtId || rating < 1 || rating > 5) return { error: "Selecciona una calificación entre 1 y 5." };
 try { await apiFetch("/api/court-reviews", { method: "POST", token: session.token, body: { courtId, rating, comment: comment || undefined } }); }
 catch (error) { return { error: error instanceof ApiError ? error.message : "No se pudo enviar la reseña." }; }
 revalidatePath("/reservas"); revalidatePath("/explorar"); return { success: "Gracias por compartir tu experiencia." };
}

async function moderator() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  return session;
}

export async function moderateReview(formData: FormData) {
  const session = await moderator();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  if (!id || !["hide", "show", "delete"].includes(decision)) return;
  try {
    await apiFetch(`/api/court-reviews/${id}${decision === "delete" ? "" : `/${decision}`}`, { method: decision === "delete" ? "DELETE" : "PATCH", token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect(`/resenas?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/resenas");
  revalidatePath("/explorar");
  redirect("/resenas");
}
