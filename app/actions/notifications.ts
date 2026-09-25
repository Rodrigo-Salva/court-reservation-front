"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
export async function markNotificationRead(formData: FormData) { const session = await getSession(); if (!session) redirect("/login"); const id = Number(formData.get("id")); if (id) await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token: session.token }); revalidatePath("/notificaciones"); }
export async function markAllNotificationsRead() { const session = await getSession(); if (!session) redirect("/login"); await apiFetch("/api/notifications/read-all", { method: "PATCH", token: session.token }); revalidatePath("/notificaciones"); }
