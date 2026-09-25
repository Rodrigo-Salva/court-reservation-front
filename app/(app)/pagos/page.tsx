import { ReceiptText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { simulatePayment } from "@/app/actions/payments";
import type { BookingResponseDTO, PaymentResponseDTO } from "@/lib/definitions";

const STATUS_STYLE: Record<PaymentResponseDTO["status"], string> = { APROBADO: "bg-emerald-100 text-emerald-700", RECHAZADO: "bg-red-100 text-red-700", REEMBOLSADO: "bg-amber-100 text-amber-700" };

export default async function PagosPage() {
  const session = await getSession();
  if (!session) return null;
  const [paymentsResult, bookingsResult] = await Promise.allSettled([
    apiFetch<PaymentResponseDTO[]>("/api/payments/my", { token: session.token }),
    apiFetch<BookingResponseDTO[]>(`/api/bookings/user/${session.userId}`, { token: session.token }),
  ]);
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
  const paymentByBooking = new Map(payments.map((payment) => [payment.bookingId, payment]));
  const payable = bookings.filter((booking) => booking.status !== "CANCELADA" && paymentByBooking.get(booking.id)?.status !== "APROBADO" && paymentByBooking.get(booking.id)?.status !== "REEMBOLSADO");

  return <div className="flex flex-col gap-8">
    <div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Demo de pagos</p><h1 className="mt-1 font-display text-3xl font-bold">Pagos y comprobantes</h1><p className="mt-2 text-sm text-muted-foreground">No se realiza ningún cobro real. Usa una tarjeta terminada en 0000 para simular un rechazo.</p></div>
    <section><h2 className="mb-4 font-display text-xl font-bold">Reservas por pagar</h2>{payable.length === 0 ? <Empty text="No tienes reservas pendientes de pago." /> : <div className="grid gap-4 lg:grid-cols-2">{payable.map((booking) => <article key={booking.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex justify-between gap-4"><div><h3 className="font-bold">{booking.courtName}</h3><p className="mt-1 text-sm text-muted-foreground">{booking.bookingDate} · {booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)}</p></div><strong>S/ {Number(booking.totalPrice).toFixed(2)}</strong></div>{paymentByBooking.get(booking.id)?.status === "RECHAZADO" && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{paymentByBooking.get(booking.id)?.rejectionReason}</p>}<form action={simulatePayment} className="mt-4 grid gap-3 sm:grid-cols-3"><input type="hidden" name="bookingId" value={booking.id}/><select name="method" defaultValue="TARJETA" className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="TARJETA">Tarjeta</option><option value="YAPE_PLIN">Yape / Plin</option><option value="EFECTIVO">Efectivo</option></select><input name="simulatedCardNumber" placeholder="Tarjeta demo (opcional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm"/><button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Simular pago</button></form></article>)}</div>}</section>
    <section><h2 className="mb-4 font-display text-xl font-bold">Historial</h2>{payments.length === 0 ? <Empty text="Aún no tienes comprobantes." /> : <div className="overflow-hidden rounded-2xl border border-border bg-card">{payments.map((payment) => <article key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 last:border-0"><div className="flex items-center gap-3"><div className="rounded-full bg-secondary p-2"><ReceiptText size={18}/></div><div><p className="font-semibold">{payment.courtName}</p><p className="text-xs text-muted-foreground">Operación {payment.operationCode} · {payment.method.replace("_", " / ")}</p></div></div><div className="flex items-center gap-3"><strong>S/ {Number(payment.amount).toFixed(2)}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_STYLE[payment.status]}`}>{payment.status}</span></div></article>)}</div>}</section>
  </div>;
}

function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">{text}</p>; }
