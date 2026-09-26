"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function purchasePackage(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const packageId = Number(formData.get("packageId"));
  if (!packageId) return;

  try {
    await apiFetch("/api/user-packages/purchase", {
      method: "POST",
      token: session.token,
      body: { userId: session.userId, packageId },
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "No se pudo completar la compra.";
    redirect(`/paquetes?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/paquetes");
  redirect("/paquetes?success=1");
}
