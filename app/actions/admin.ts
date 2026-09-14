"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type {
  CourtResponseDTO,
  PackageResponseDTO,
  ProfileFormState,
} from "@/lib/definitions";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/explorar");
  return session;
}

export async function saveCourt(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await requireAdmin();

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const body = {
    name: String(formData.get("name") ?? "").trim(),
    sportType: String(formData.get("sportType") ?? ""),
    capacity: Number(formData.get("capacity")),
    basePricePerHour: Number(formData.get("basePricePerHour")),
    description: String(formData.get("description") ?? "").trim() || undefined,
  };

  try {
    await apiFetch<CourtResponseDTO>(id ? `/api/courts/${id}` : "/api/courts", {
      method: id ? "PUT" : "POST",
      token: session.token,
      body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors = Object.fromEntries(
        (error.fieldErrors ?? []).map((f) => [f.field, f.message])
      );
      return {
        error: error.fieldErrors?.length ? undefined : error.message,
        fieldErrors,
      };
    }
    return { error: "No se pudo guardar la cancha." };
  }

  revalidatePath("/administracion");
  return { success: true };
}

export async function toggleCourtActive(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;

  try {
    if (active) {
      await apiFetch(`/api/courts/${id}`, { method: "DELETE", token: session.token });
    } else {
      await apiFetch(`/api/courts/${id}/activate`, {
        method: "PATCH",
        token: session.token,
      });
    }
  } catch {
    // La UI se revalida igual y refleja el estado real desde el servidor.
  }

  revalidatePath("/administracion");
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;
  if (id === session.userId) return; // no desactivarse a si mismo

  try {
    if (active) {
      await apiFetch(`/api/users/${id}`, { method: "DELETE", token: session.token });
    } else {
      await apiFetch(`/api/users/${id}/activate`, {
        method: "PATCH",
        token: session.token,
      });
    }
  } catch {
    // La UI se revalida igual y refleja el estado real desde el servidor.
  }

  revalidatePath("/administracion");
}

export async function savePackage(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await requireAdmin();

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const body = {
    name: String(formData.get("name") ?? "").trim(),
    hoursQuantity: Number(formData.get("hoursQuantity")),
    price: Number(formData.get("price")),
    discountPercentage: Number(formData.get("discountPercentage")) / 100,
    validityDays: Number(formData.get("validityDays")),
  };

  try {
    await apiFetch<PackageResponseDTO>(
      id ? `/api/packages/${id}` : "/api/packages",
      {
        method: id ? "PUT" : "POST",
        token: session.token,
        body,
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors = Object.fromEntries(
        (error.fieldErrors ?? []).map((f) => [f.field, f.message])
      );
      return {
        error: error.fieldErrors?.length ? undefined : error.message,
        fieldErrors,
      };
    }
    return { error: "No se pudo guardar el paquete." };
  }

  revalidatePath("/administracion");
  return { success: true };
}

export async function togglePackageActive(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;

  try {
    if (active) {
      await apiFetch(`/api/packages/${id}`, { method: "DELETE", token: session.token });
    } else {
      await apiFetch(`/api/packages/${id}/activate`, {
        method: "PATCH",
        token: session.token,
      });
    }
  } catch {
    // La UI se revalida igual y refleja el estado real desde el servidor.
  }

  revalidatePath("/administracion");
}
