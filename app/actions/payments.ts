"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function simulatePayment(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const bookingId = Number(formData.get("bookingId"));
  const method = String(formData.get("method"));
  const simulatedCardNumber = String(formData.get("simulatedCardNumber") ?? "").trim();
  if (!bookingId || !["TARJETA", "YAPE_PLIN", "EFECTIVO"].includes(method)) return;
  try {
    await apiFetch("/api/payments", { method: "POST", token: session.token, body: { bookingId, method, simulatedCardNumber: simulatedCardNumber || undefined } });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  revalidatePath("/pagos");
}

export async function refundPayment(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiFetch(`/api/payments/${id}/refund`, { method: "PATCH", token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect(`/transacciones?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/transacciones");
  redirect("/transacciones?success=1");
}
