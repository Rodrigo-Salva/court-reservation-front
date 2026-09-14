"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
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
  } catch {
    // Si la compra falla (p.ej. paquete desactivado) el usuario simplemente
    // no vera un paquete nuevo en su lista al revalidar.
  }

  revalidatePath("/paquetes");
}
