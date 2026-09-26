import { ConfirmButton } from "@/components/forms";
import { redirect } from "next/navigation";
import { CalendarClock, ClipboardCheck, Search, UserX } from "lucide-react";
import { getSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { registerCheckIn, markNoShow } from "@/app/actions/checkin";
import { QrScanner } from "@/components/QrScanner";
import { Pagination } from "@/components/Pagination";
import { Avatar, EmptyState, Notice, PageHeader, cardClass, dangerButton, inputClass, primaryButton } from "@/components/ui";
import type { BookingResponseDTO, PageResponse } from "@/lib/definitions";

const PAGE_SIZE = 8;

export default async function RecepcionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"].includes(session.role)) redirect("/explorar");
  const { success, error, q, page } = await searchParams;

  const query = new URLSearchParams({ status: "CONFIRMADA", size: String(PAGE_SIZE), page: String(Math.max(0, Number(page) || 0)) });
  if (q?.trim()) query.set("q", q.trim());
  let result: PageResponse<BookingResponseDTO> | null = null;
  try { result = await apiFetch<PageResponse<BookingResponseDTO>>(`/api/bookings/search?${query}`, { token: session.token }); } catch { /* La recepción sigue disponible sin la lista. */ }
  const pending = result?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Operación" title="Recepción y check-in" description="Registra el ingreso de los clientes con el lector de QR o con el código de su reserva." />

      {success && <Notice tone="success">{success === "1" ? "Check-in registrado correctamente." : success}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <QrScanner />

          <form action={registerCheckIn} className={`${cardClass} flex flex-col gap-4 p-5`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-emerald-800"><ClipboardCheck size={19} /></span>
              <div>
                <h2 className="font-display text-lg font-bold">Ingreso manual</h2>
                <p className="text-xs text-muted-foreground">Pega el código del QR del cliente.</p>
              </div>
            </div>
            <label className="text-sm font-semibold">Código de check-in
              <input required name="code" placeholder="Código del QR" className={`${inputClass} mt-1.5 font-mono text-xs font-normal`} />
            </label>
            <label className="text-sm font-semibold">ID de reserva <span className="font-normal text-muted-foreground">(opcional)</span>
              <input name="bookingId" type="number" min="1" placeholder="Ej.: 123" className={`${inputClass} mt-1.5 font-normal`} />
            </label>
            <ConfirmButton message="Se registrará el ingreso del cliente." confirmLabel="Sí, validar" className={primaryButton}>Validar ingreso</ConfirmButton>
          </form>
        </div>

        <section className={`${cardClass} flex flex-col lg:col-span-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-bold">Reservas confirmadas</h2>
              <p className="text-xs text-muted-foreground">Pendientes de ingreso o de marcar no-show.</p>
            </div>
            <form className="flex min-w-56 flex-1 gap-2 sm:max-w-xs">
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input name="q" defaultValue={q ?? ""} placeholder="Cliente o cancha" aria-label="Buscar reservas" className={`${inputClass} pl-9`} />
              </label>
              <button className={primaryButton}>Buscar</button>
            </form>
          </div>

          {pending.length === 0 ? (
            <div className="p-6"><EmptyState icon={CalendarClock} title="No hay reservas pendientes de atención" description="Cuando haya reservas confirmadas aparecerán aquí." /></div>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <div className="w-24 shrink-0 rounded-xl bg-secondary px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{booking.bookingDate.slice(8, 10)}/{booking.bookingDate.slice(5, 7)}</p>
                    <p className="text-sm font-bold tabular-nums">{booking.startTime.slice(0, 5)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{booking.courtName}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Avatar name={booking.userName} />{booking.userName} · #{booking.id}</p>
                  </div>
                  <form action={markNoShow}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <ConfirmButton message="La reserva se marcará como no-show (no asistió)." tone="danger" confirmLabel="Sí, marcar no-show" className={dangerButton}><UserX size={13} />No-show</ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {result && (
            <div className="mt-auto border-t border-border p-4">
              <Pagination basePath="/recepcion" page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} params={{ q }} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
