import { ConfirmButton } from "@/components/forms";
import Link from "next/link";
import { Banknote, CheckCircle2, CreditCard, ReceiptText, Smartphone, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { simulatePayment } from "@/app/actions/payments";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, PageHeader, StatCard, StatusPill, cardClass, inputClass, primaryButton, type PillTone } from "@/components/ui";
import { hhmm, money, shortDate } from "@/lib/format";
import type { BookingResponseDTO, PaymentResponseDTO } from "@/lib/definitions";

const PAGE_SIZE = 6;
const STATUS_TONE: Record<PaymentResponseDTO["status"], PillTone> = { APROBADO: "success", RECHAZADO: "danger", REEMBOLSADO: "warning" };
const METHOD: Record<PaymentResponseDTO["method"], { label: string; icon: typeof CreditCard }> = {
  TARJETA: { label: "Tarjeta", icon: CreditCard },
  YAPE_PLIN: { label: "Yape / Plin", icon: Smartphone },
  EFECTIVO: { label: "Efectivo", icon: Banknote },
};

export default async function PagosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { page } = await searchParams;

  const [paymentsResult, bookingsResult] = await Promise.allSettled([
    apiFetch<PaymentResponseDTO[]>("/api/payments/my", { token: session.token }),
    apiFetch<BookingResponseDTO[]>(`/api/bookings/user/${session.userId}`, { token: session.token }),
  ]);
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];

  const paymentByBooking = new Map(payments.map((payment) => [payment.bookingId, payment]));
  const payable = bookings.filter((booking) => {
    const status = paymentByBooking.get(booking.id)?.status;
    return booking.status !== "CANCELADA" && status !== "APROBADO" && status !== "REEMBOLSADO";
  });
  const paidTotal = payments.filter((p) => p.status === "APROBADO").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingTotal = payable.reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const history = paginate(payments, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Demo de pagos" title="Pagos y comprobantes" description="No se realiza ningún cobro real. Usa una tarjeta terminada en 0000 para simular un rechazo." />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen">
        <StatCard icon={CheckCircle2} tone="green" label="Pagado" value={money(paidTotal)} hint={`${payments.filter((p) => p.status === "APROBADO").length} pago(s) aprobado(s)`} />
        <StatCard icon={Wallet} tone="amber" label="Por pagar" value={money(pendingTotal)} hint={`${payable.length} reserva(s) pendiente(s)`} />
        <StatCard icon={ReceiptText} tone="slate" label="Comprobantes" value={String(payments.length)} hint="en tu historial" />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="por-pagar">
        <h2 id="por-pagar" className="font-display text-xl font-bold">Reservas por pagar</h2>
        {payable.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Estás al día" description="No tienes reservas pendientes de pago." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {payable.map((booking) => {
              const previous = paymentByBooking.get(booking.id);
              return (
                <article key={booking.id} className={`${cardClass} flex flex-col gap-4 p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{booking.courtName}</h3>
                      <p className="text-sm text-muted-foreground">{shortDate(booking.bookingDate)} · {hhmm(booking.startTime)}–{hhmm(booking.endTime)}</p>
                    </div>
                    <strong className="font-display text-xl">{money(booking.totalPrice)}</strong>
                  </div>
                  {previous?.status === "RECHAZADO" && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{previous.rejectionReason}</p>}
                  <form action={simulatePayment} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <select name="method" defaultValue="TARJETA" aria-label="Método de pago" className={inputClass}>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="YAPE_PLIN">Yape / Plin</option>
                      <option value="EFECTIVO">Efectivo</option>
                    </select>
                    <input name="simulatedCardNumber" placeholder="Tarjeta demo (opcional)" aria-label="Número de tarjeta de prueba" className={inputClass} />
                    <ConfirmButton message="Se registrará el pago de esta reserva." confirmLabel="Sí, pagar" className={primaryButton}>Pagar</ConfirmButton>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="historial">
        <h2 id="historial" className="font-display text-xl font-bold">Historial</h2>
        {payments.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Aún no tienes comprobantes" description="Tus pagos aparecerán aquí." />
        ) : (
          <div className={`${cardClass} overflow-hidden`}>
            <ul className="divide-y divide-border">
              {history.items.map((payment) => {
                const method = METHOD[payment.method];
                const MethodIcon = method.icon;
                return (
                  <li key={payment.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground"><ReceiptText size={18} /></span>
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-semibold">{payment.courtName}</p>
                      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="font-mono">{payment.operationCode}</span>
                        <span className="inline-flex items-center gap-1"><MethodIcon size={12} />{method.label}</span>
                      </p>
                    </div>
                    <strong className="tabular-nums">{money(payment.amount)}</strong>
                    <StatusPill tone={STATUS_TONE[payment.status]}>{payment.status}</StatusPill>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border p-4">
              <Pagination basePath="/pagos" page={history.page} totalPages={history.totalPages} totalElements={history.totalElements} />
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">¿Necesitas reservar? <Link href="/reservas/nueva" className="font-semibold text-primary hover:underline">Crea una nueva reserva</Link>.</p>
      </section>
    </div>
  );
}
