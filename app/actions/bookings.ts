"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type {
  BookingFormState,
  BookingResponseDTO,
  RecurrentBookingResponseDTO,
} from "@/lib/definitions";

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const courtId = Number(formData.get("courtId"));
  const bookingDate = String(formData.get("bookingDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const usesPackage = formData.get("usesPackage") === "true";
  const userPackageId = formData.get("userPackageId")
    ? Number(formData.get("userPackageId"))
    : undefined;
  const isRecurrent = formData.get("isRecurrent") === "true";
  const numberOfWeeks = Number(formData.get("numberOfWeeks") ?? 0);

  if (!courtId || !bookingDate || !startTime || !endTime) {
    return { error: "Selecciona cancha, fecha y horario disponible." };
  }

  try {
    if (isRecurrent) {
      if (!numberOfWeeks || numberOfWeeks < 2) {
        return { error: "Las reservas recurrentes requieren al menos 2 semanas." };
      }
      const result = await apiFetch<RecurrentBookingResponseDTO>(
        "/api/bookings/recurrent",
        {
          method: "POST",
          token: session.token,
          body: {
            courtId,
            startDate: bookingDate,
            startTime,
            endTime,
            frequency: "SEMANAL",
            numberOfWeeks,
            usesPackage,
            userPackageId,
          },
        }
      );
      if (result.successfulBookings === 0) {
        return {
          error:
            "No se pudo crear ninguna reserva recurrente: el horario no está disponible en esas semanas.",
        };
      }
    } else {
      await apiFetch<BookingResponseDTO>("/api/bookings", {
        method: "POST",
        token: session.token,
        body: { courtId, bookingDate, startTime, endTime, usesPackage, userPackageId },
      });
    }
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo crear la reserva. Intenta de nuevo.",
    };
  }

  revalidatePath("/reservas");
  redirect("/reservas");
}

export async function cancelBooking(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const bookingId = Number(formData.get("bookingId"));
  const reason = String(formData.get("reason") ?? "");
  if (!bookingId) return;

  try {
    await apiFetch("/api/bookings/cancel", {
      method: "PUT",
      token: session.token,
      body: { bookingId, reason: reason || undefined },
    });
  } catch {
    // La UI vuelve a mostrar el estado real de la reserva al revalidar;
    // si la cancelacion fallo (p.ej. reserva ya cancelada) simplemente no cambia nada.
  }

  revalidatePath("/reservas");
}
