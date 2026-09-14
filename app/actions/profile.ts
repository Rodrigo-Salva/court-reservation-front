"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { createSession, getSession } from "@/lib/session";
import type { ProfileFormState, UserResponseDTO } from "@/lib/definitions";

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const membershipType = String(formData.get("membershipType") ?? "NINGUNA");

  try {
    const updated = await apiFetch<UserResponseDTO>(
      `/api/users/${session.userId}`,
      {
        method: "PUT",
        token: session.token,
        body: {
          name,
          email: session.email,
          phone,
          membershipType,
          // UserRequestDTO exige password, pero el backend la ignora en un
          // update (UserMapper.updateEntityFromDTO la marca @Mapping ignore),
          // así que este valor nunca sobreescribe la contraseña real.
          password: "unchanged",
        },
      }
    );

    await createSession({
      ...session,
      name: updated.name,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors = Object.fromEntries(
        (error.fieldErrors ?? []).map((fieldError) => [
          fieldError.field,
          fieldError.message,
        ])
      );
      return {
        error: error.fieldErrors?.length ? undefined : error.message,
        fieldErrors,
      };
    }
    return { error: "No se pudo actualizar el perfil. Intenta de nuevo." };
  }

  revalidatePath("/perfil");
  return { success: true };
}
