import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { type BookingResponseDTO } from "@/lib/definitions";
import { CancelBookingAction } from "@/components/CancelBookingAction";
import { CheckInQr } from "@/components/CheckInQr";
import { RescheduleBookingAction } from "@/components/RescheduleBookingAction";
import { CourtReviewAction } from "@/components/CourtReviewAction";

const CANCELLABLE_STATUSES = new Set(["PENDIENTE", "CONFIRMADA"]);

function formatDateBlock(dateString: string) {
  try {
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    
    const formatterDayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
    const formatterMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });
    
    const dayName = formatterDayName.format(date).toUpperCase().replace('.', '');
    const monthName = formatterMonth.format(date).toUpperCase().replace('.', '');
    
    return { dayName, dayNumber: d.toString(), monthName };
  } catch {
    return { dayName: "DAY", dayNumber: "00", monthName: "MON" };
  }
}

// Inferred sport based on court name
function inferSport(courtName: string) {
  const lower = courtName.toLowerCase();
  if (lower.includes("pádel") || lower.includes("padel")) return "Pádel";
  if (lower.includes("fútbol") || lower.includes("futbol")) return "Fútbol";
  if (lower.includes("tenis")) return "Tenis";
  if (lower.includes("básquet") || lower.includes("basquet")) return "Básquet";
  if (lower.includes("vóley") || lower.includes("voley")) return "Vóley";
  return "Deporte";
}

export default async function ReservasPage() {
  const session = await getSession();
  let bookings: BookingResponseDTO[] = [];
  let error: string | null = null;

  try {
    bookings = await apiFetch<BookingResponseDTO[]>(
      `/api/bookings/user/${session!.userId}`,
      { token: session!.token }
    );
    bookings.sort((a, b) =>
      `${a.bookingDate}${a.startTime}`.localeCompare(
        `${b.bookingDate}${b.startTime}`
      )
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "No se pudieron cargar tus reservas.";
  }

  const checkInCodes = new Map<number, string>();
  if (!error) {
    await Promise.all(bookings.filter((booking) => booking.status === "CONFIRMADA").map(async (booking) => {
      try {
        const response = await apiFetch<{ code: string }>(`/api/bookings/${booking.id}/check-in-code`, { token: session!.token });
        checkInCodes.set(booking.id, response.code);
      } catch { /* El QR es opcional; una falla no oculta la reserva. */ }
    }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tu actividad</p>
          <h1 className="font-display text-4xl sm:text-4xl font-bold text-foreground">
            Mis reservas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestiona tus próximos partidos y revisa tu historial.
          </p>
        </div>
        <Link
          href="/reservas/nueva"
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1"
        >
          + Nueva reserva
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/50 pb-px">
        <button className="px-4 py-2 bg-card rounded-t-xl border border-border/50 border-b-0 font-bold text-sm text-foreground shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative z-10 -mb-px">
          Próximas
        </button>
        <button className="px-4 py-2 font-semibold text-sm text-muted-foreground hover:text-foreground">
          Pasadas
        </button>
        <button className="px-4 py-2 font-semibold text-sm text-muted-foreground hover:text-foreground">
          Todas
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && bookings.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Todavía no tienes reservas.{" "}
          <Link href="/reservas/nueva" className="text-[#22c55e] font-bold hover:underline">
            Reserva tu primera cancha
          </Link>
          .
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {bookings.map((booking) => {
          const dateBlock = formatDateBlock(booking.bookingDate);
          return (
            <li
              key={booking.id}
              className="flex items-center gap-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              {/* Date Box */}
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-secondary border border-border shrink-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{dateBlock.dayName}</span>
                <span className="text-xl font-bold text-foreground leading-none my-0.5">{dateBlock.dayNumber}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{dateBlock.monthName}</span>
              </div>

              {/* Center Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={booking.status} id={booking.id} />
                </div>
                
                <h3 className="font-bold text-lg text-foreground truncate">
                  {booking.courtName}
                </h3>
                
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span className="opacity-60">〽</span>
                  {inferSport(booking.courtName)} {booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}
                </p>
              </div>

              {/* Right Side */}
              <div className="flex flex-col items-end shrink-0 gap-3">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Total</p>
                  <p className="text-lg font-bold text-foreground leading-none">
                    S/ {booking.totalPrice.toFixed(2)}
                  </p>
                </div>
                
                {CANCELLABLE_STATUSES.has(booking.status) && (
                  <CancelBookingAction 
                    bookingId={booking.id} 
                    totalPrice={booking.totalPrice} 
                    isRecurrent={booking.isRecurrent || false} 
                  />
                )}
                {booking.status === "PENDIENTE" && (
                  <div className="flex flex-col items-end gap-1">
                    {booking.paymentDeadline && <p className="text-[10px] font-semibold text-amber-600">Paga antes de las {booking.paymentDeadline.slice(11, 16)}</p>}
                    <Link href="/pagos" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Pagar ahora</Link>
                  </div>
                )}
                {booking.status === "CONFIRMADA" && <RescheduleBookingAction bookingId={booking.id} date={booking.bookingDate} startTime={booking.startTime} endTime={booking.endTime} />}
                {booking.status === "COMPLETADA" && <CourtReviewAction courtId={booking.courtId} courtName={booking.courtName} />}
                {booking.status === "CONFIRMADA" && <CheckInQr bookingId={booking.id} code={checkInCodes.get(booking.id)} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBadge({ status, id }: { status: string, id: number }) {
  let bgColor = "bg-[#22c55e]";
  let textColor = "text-[#22c55e]";
  let label = "CONFIRMADA";

  if (status === "PENDIENTE") {
    bgColor = "bg-[#f59e0b]";
    textColor = "text-[#f59e0b]";
    label = "PENDIENTE";
  } else if (status === "CANCELADA" || status === "NO_SHOW") {
    bgColor = "bg-[#ef4444]";
    textColor = "text-[#ef4444]";
    label = status;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 rounded-full ${bgColor}/10 px-2 py-0.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${bgColor}`}></span>
        <span className={`text-[9px] font-bold ${textColor} uppercase tracking-wider`}>
          {label}
        </span>
      </div>
      <span className="text-[9px] font-bold text-muted-foreground uppercase">
        RES-{id.toString().padStart(4, '0')}
      </span>
    </div>
  );
}
