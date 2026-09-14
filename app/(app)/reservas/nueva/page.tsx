import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { DayStrip } from "@/components/DayStrip";
import { BookingWizard } from "@/components/BookingWizard";
import { sportLabel } from "@/lib/sport";
import type {
  CourtAvailabilityResponseDTO,
  CourtResponseDTO,
  UserPackageResponseDTO,
  UserResponseDTO,
} from "@/lib/definitions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ courtId?: string; date?: string }>;
}) {
  const { courtId, date } = await searchParams;
  const session = await getSession();
  const selectedDate = date ?? todayISO();

  // Sin cancha elegida todavia: mostrar selector simple antes de la grilla.
  if (!courtId) {
    let courts: CourtResponseDTO[] = [];
    let error: string | null = null;
    try {
      courts = await apiFetch<CourtResponseDTO[]>("/api/courts", {
        token: session?.token,
      });
    } catch (err) {
      error =
        err instanceof ApiError ? err.message : "No se pudieron cargar las canchas.";
    }

    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground">
          ¿Qué cancha quieres reservar?
        </h1>

        {error && (
          <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {courts.map((court) => (
            <Link
              key={court.id}
              href={`/reservas/nueva?courtId=${court.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-[#22c55e] transition-colors"
            >
              <div>
                <p className="font-bold text-foreground">{court.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sportLabel(court.sportType)} · S/ {court.basePricePerHour}/hora
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  let court: CourtResponseDTO | null = null;
  let error: string | null = null;
  try {
    court = await apiFetch<CourtResponseDTO>(`/api/courts/${courtId}`, {
      token: session?.token,
    });
  } catch (err) {
    error = err instanceof ApiError ? err.message : "No se pudo cargar la cancha.";
  }

  if (error || !court) {
    return (
      <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  let availability: CourtAvailabilityResponseDTO = {
    courtId: court.id,
    courtName: court.name,
    date: selectedDate,
    availableSlots: [],
    occupiedSlots: [],
  };
  let availabilityError: string | null = null;
  try {
    availability = await apiFetch<CourtAvailabilityResponseDTO>(
      `/api/bookings/court/${court.id}/availability?date=${selectedDate}`,
      { token: session?.token }
    );
  } catch (err) {
    availabilityError =
      err instanceof ApiError ? err.message : "No se pudo cargar la disponibilidad.";
  }

  let bestPackage: UserPackageResponseDTO | null = null;
  try {
    bestPackage = await apiFetch<UserPackageResponseDTO>(
      `/api/user-packages/user/${session!.userId}/best-available`,
      { token: session!.token }
    );
  } catch {
    // 404 esperado si el usuario no tiene paquetes activos: el toggle simplemente no se muestra.
  }

  let membershipDiscount = 0;
  let maxDaysAdvance = 7;
  try {
    const user = await apiFetch<UserResponseDTO>(`/api/users/${session!.userId}`, {
      token: session!.token,
    });
    membershipDiscount = user.membershipDiscount;
    maxDaysAdvance = user.maxDaysAdvance;
  } catch {
    // Si falla, se muestran los valores por defecto (sin descuento, 7 dias).
  }

  return (
    <div>
      <Link
        href="/explorar"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Volver a resultados
      </Link>

      <div className="mt-4 flex flex-col sm:flex-row gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div
          className={`h-24 sm:w-40 shrink-0 rounded-xl bg-[#22c55e] flex items-center justify-center text-white text-2xl`}
        >
          〽
        </div>
        <div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground uppercase mb-1">
            {sportLabel(court.sportType)}
          </span>
          <h1 className="font-display text-xl font-bold text-foreground">
            {court.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Hasta {court.capacity} personas · desde S/ {court.basePricePerHour}/hora
          </p>
          {court.description && (
            <p className="mt-1 text-xs text-muted-foreground">{court.description}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <DayStrip courtId={court.id} selectedDate={selectedDate} />
      </div>

      {availabilityError && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {availabilityError}
        </p>
      )}

      {!availabilityError && (
        <div className="mt-6">
          <BookingWizard
            court={court}
            date={selectedDate}
            availableSlots={availability.availableSlots}
            occupiedSlots={availability.occupiedSlots}
            bestPackage={bestPackage}
            membershipDiscount={membershipDiscount}
            maxDaysAdvance={maxDaysAdvance}
          />
        </div>
      )}
    </div>
  );
}
