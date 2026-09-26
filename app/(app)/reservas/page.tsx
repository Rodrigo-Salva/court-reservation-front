import Link from "next/link";
import { CalendarPlus, CalendarX, Clock, Hash } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { BOOKING_STATUS_LABELS, SPORT_TYPES, type BookingResponseDTO, type UserResponseDTO } from "@/lib/definitions";
import { dateBlock, hhmm, money, nowMs, startsAt } from "@/lib/format";
import { CancelBookingAction } from "@/components/CancelBookingAction";
import { CheckInQr } from "@/components/CheckInQr";
import { RescheduleBookingAction } from "@/components/RescheduleBookingAction";
import { CourtReviewAction } from "@/components/CourtReviewAction";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, FilterTabs, Notice, PageHeader, StatusPill, cardClass, primaryButton, type PillTone } from "@/components/ui";

const PAGE_SIZE = 5;
const CANCELLABLE = new Set(["PENDIENTE", "CONFIRMADA"]);
const UPCOMING = new Set(["PENDIENTE", "CONFIRMADA"]);
const STATUS_TONE: Record<string, PillTone> = { CONFIRMADA: "success", PENDIENTE: "warning", CANCELADA: "danger", NO_SHOW: "danger", COMPLETADA: "info" };
const TABS = [
  { label: "Próximas", value: "proximas" },
  { label: "Pasadas", value: "pasadas" },
  { label: "Todas", value: "todas" },
] as const;

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** El backend no envía el deporte en la reserva; se infiere del nombre de la cancha. */
function sportOf(courtName: string) {
  const name = normalize(courtName);
  return SPORT_TYPES.find((sport) => name.includes(normalize(sport.label)) || name.includes(sport.value.toLowerCase()))?.label ?? "Deporte";
}

export default async function ReservasPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const session = await getSession();
  const { tab: rawTab, page } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? (rawTab as (typeof TABS)[number]["value"]) : "proximas";

  let bookings: BookingResponseDTO[] = [];
  let error: string | null = null;
  try {
    bookings = await apiFetch<BookingResponseDTO[]>(`/api/bookings/user/${session!.userId}`, { token: session!.token });
  } catch (err) {
    error = err instanceof ApiError ? err.message : "No se pudieron cargar tus reservas.";
  }

  let isVip = false;
  try {
    isVip = (await apiFetch<UserResponseDTO>(`/api/users/${session!.userId}`, { token: session!.token })).membershipType === "VIP";
  } catch { /* Sin el dato, el diálogo muestra la política general. */ }

  const now = nowMs();
  const isUpcoming = (b: BookingResponseDTO) => UPCOMING.has(b.status) && startsAt(b.bookingDate, b.endTime) >= now;
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => startsAt(a.bookingDate, a.startTime) - startsAt(b.bookingDate, b.startTime));
  const past = bookings.filter((b) => !isUpcoming(b)).sort((a, b) => startsAt(b.bookingDate, b.startTime) - startsAt(a.bookingDate, a.startTime));
  const all = [...bookings].sort((a, b) => startsAt(b.bookingDate, b.startTime) - startsAt(a.bookingDate, a.startTime));
  const source = tab === "proximas" ? upcoming : tab === "pasadas" ? past : all;
  const view = paginate(source, page, PAGE_SIZE);

  // El QR solo se pide para las reservas confirmadas que se muestran en la página actual.
  const checkInCodes = new Map<number, string>();
  await Promise.all(view.items.filter((b) => b.status === "CONFIRMADA").map(async (b) => {
    try {
      const response = await apiFetch<{ code: string }>(`/api/bookings/${b.id}/check-in-code`, { token: session!.token });
      checkInCodes.set(b.id, response.code);
    } catch { /* El QR es opcional; una falla no oculta la reserva. */ }
  }));

  const counts = { proximas: upcoming.length, pasadas: past.length, todas: bookings.length };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Tu actividad"
        title="Mis reservas"
        description="Gestiona tus próximos partidos y revisa tu historial."
        actions={<Link href="/reservas/nueva" className={primaryButton}><CalendarPlus size={16} />Nueva reserva</Link>}
      />

      {error && <Notice tone="error">{error}</Notice>}

      <FilterTabs items={TABS.map((t) => ({ label: t.label, href: t.value === "proximas" ? "/reservas" : `/reservas?tab=${t.value}`, active: tab === t.value, count: counts[t.value] }))} />

      {!error && view.items.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={bookings.length === 0 ? "Todavía no tienes reservas" : "No hay reservas en esta pestaña"}
          description={bookings.length === 0 ? "Reserva tu primera cancha y aparecerá aquí." : "Prueba con otra pestaña."}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {view.items.map((booking) => {
            const block = dateBlock(booking.bookingDate);
            return (
              <li key={booking.id} className={`${cardClass} flex flex-wrap items-center gap-x-5 gap-y-4 p-4 transition hover:shadow-md sm:p-5`}>
                <div className="flex size-18 shrink-0 flex-col items-center justify-center rounded-2xl bg-secondary">
                  <span className="text-[10px] font-bold text-muted-foreground">{block.weekday}</span>
                  <span className="font-display text-2xl font-bold leading-none">{block.day}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{block.month}</span>
                </div>

                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={STATUS_TONE[booking.status] ?? "neutral"}>{BOOKING_STATUS_LABELS[booking.status] ?? booking.status}</StatusPill>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground"><Hash size={11} />RES-{String(booking.id).padStart(4, "0")}</span>
                  </div>
                  <h2 className="mt-1.5 truncate text-lg font-bold">{booking.courtName}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock size={13} />{sportOf(booking.courtName)} · {hhmm(booking.startTime)} – {hhmm(booking.endTime)}
                  </p>
                </div>

                <div className="ml-auto flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Total</p>
                    <p className="font-display text-xl font-bold leading-none">{money(booking.totalPrice)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {booking.status === "PENDIENTE" && (
                      <>
                        {booking.paymentDeadline && <span className="text-[11px] font-semibold text-amber-600">Paga antes de las {booking.paymentDeadline.slice(11, 16)}</span>}
                        <Link href="/pagos" className={primaryButton}>Pagar ahora</Link>
                      </>
                    )}
                    {booking.status === "CONFIRMADA" && <RescheduleBookingAction bookingId={booking.id} date={booking.bookingDate} startTime={booking.startTime} endTime={booking.endTime} />}
                    {booking.status === "CONFIRMADA" && <CheckInQr bookingId={booking.id} code={checkInCodes.get(booking.id)} />}
                    {booking.status === "COMPLETADA" && <CourtReviewAction courtId={booking.courtId} courtName={booking.courtName} />}
                    {CANCELLABLE.has(booking.status) && <CancelBookingAction bookingId={booking.id} totalPrice={booking.totalPrice} isRecurrent={booking.isRecurrent || false} bookingDate={booking.bookingDate} startTime={booking.startTime} unpaid={booking.status === "PENDIENTE"} isVip={isVip} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!error && <Pagination basePath="/reservas" page={view.page} totalPages={view.totalPages} totalElements={view.totalElements} params={{ tab: tab === "proximas" ? undefined : tab }} />}
    </div>
  );
}
