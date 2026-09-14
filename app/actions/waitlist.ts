"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { BookingFormState, WaitingListResponseDTO } from "@/lib/definitions";

export async function joinWaitingList(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const courtId = Number(formData.get("courtId"));
  const desiredDate = String(formData.get("desiredDate") ?? "");
  const desiredStartTime = String(formData.get("desiredStartTime") ?? "");
  const desiredEndTime = String(formData.get("desiredEndTime") ?? "");

  if (!courtId || !desiredDate || !desiredStartTime || !desiredEndTime) {
    return { error: "Completa cancha, fecha y horario deseado." };
  }

  try {
    await apiFetch<WaitingListResponseDTO>("/api/waiting-list", {
      method: "POST",
      token: session.token,
      body: {
        userId: session.userId,
        courtId,
        desiredDate,
        desiredStartTime,
        desiredEndTime,
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo unir a la lista de espera. Intenta de nuevo.",
    };
  }

  revalidatePath("/espera");
  return { success: "Te uniste a la lista de espera." };
}

export async function leaveWaitingList(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const id = Number(formData.get("id"));
  if (!id) return;

  try {
    await apiFetch(`/api/waiting-list/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  } catch {
    // Si falla (p.ej. ya fue eliminada) la lista simplemente se revalida tal cual esta.
  }

  revalidatePath("/espera");
}
