import { Bell, CheckCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import type { UserNotificationResponseDTO } from "@/lib/definitions";

export default async function NotificacionesPage() {
  const session = await getSession();
  if (!session) return null;
  let notifications: UserNotificationResponseDTO[] = [];
  try { notifications = await apiFetch<UserNotificationResponseDTO[]>("/api/notifications/my", { token: session.token }); } catch { /* La pantalla conserva un estado vacío si el servicio no está disponible. */ }
  const unread = notifications.filter((notification) => !notification.read).length;
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Centro de actividad</p><h1 className="mt-1 font-display text-3xl font-bold">Notificaciones</h1><p className="mt-2 text-sm text-muted-foreground">{unread ? `${unread} sin leer` : "Estás al día con tus reservas."}</p></div>{unread > 0 && <form action={markAllNotificationsRead}><button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-secondary"><CheckCheck size={16}/> Marcar todas leídas</button></form>}</div>{notifications.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Aún no tienes notificaciones.</p> : <div className="overflow-hidden rounded-2xl border border-border bg-card">{notifications.map((notification) => <article key={notification.id} className={`flex gap-4 border-b border-border p-5 last:border-0 ${notification.read ? "" : "bg-primary/5"}`}><Bell className="mt-0.5 shrink-0 text-primary" size={18}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{notification.title}</h2><time className="shrink-0 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString("es-PE")}</time></div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p></div>{!notification.read && <form action={markNotificationRead}><input type="hidden" name="id" value={notification.id}/><button className="shrink-0 text-xs font-bold text-primary">Leída</button></form>}</article>)}</div>}</div>;
}
