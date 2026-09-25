import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { FiltersBar } from "@/components/FiltersBar";
import {
  SPORT_TYPES,
  type CourtAvailabilityResponseDTO,
  type CourtResponseDTO,
  type CourtReviewResponseDTO,
} from "@/lib/definitions";
import { sportLabel, SPORT_COLORS } from "@/lib/sport";
import { Zap, MapPin, ChevronRight, Star } from "lucide-react";

const DEFAULT_MAX_PRICE = 200;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildHref(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/explorar?${qs}` : "/explorar";
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; maxPrice?: string; date?: string }>;
}) {
  const { sport, maxPrice, date } = await searchParams;
  const session = await getSession();
  const selectedDate = date ?? todayISO();
  const selectedMaxPrice = maxPrice ? Number(maxPrice) : DEFAULT_MAX_PRICE;

  let allCourts: CourtResponseDTO[] = [];
  let error: string | null = null;
  try {
    allCourts = await apiFetch<CourtResponseDTO[]>("/api/courts", {
      token: session?.token,
    });
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "No se pudo cargar la disponibilidad de canchas.";
  }

  const courts = allCourts.filter((court) => {
    if (sport && court.sportType !== sport) return false;
    if (court.basePricePerHour > selectedMaxPrice) return false;
    return true;
  });

  // Horarios reales disponibles por cancha para la fecha elegida.
  const availabilityByCourtId = new Map<number, number>();
  const reviewsByCourtId = new Map<number, CourtReviewResponseDTO[]>();
  if (!error) {
    await Promise.all(
      courts.map(async (court) => {
        try {
          const availability = await apiFetch<CourtAvailabilityResponseDTO>(
            `/api/bookings/court/${court.id}/availability?date=${selectedDate}`,
            { token: session?.token }
          );
          availabilityByCourtId.set(
            court.id,
            availability.availableSlots.length
          );
        } catch {
          availabilityByCourtId.set(court.id, 0);
        }
        try {
          const reviews = await apiFetch<CourtReviewResponseDTO[]>(
            `/api/court-reviews/court/${court.id}`
          );
          reviewsByCourtId.set(court.id, reviews);
        } catch {
          reviewsByCourtId.set(court.id, []);
        }
      })
    );
  }

  const currentParams = { sport, maxPrice, date };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Juega hoy
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Tu próxima cancha,
            <br />
            <span className="text-[#22c55e]">a un toque.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Reserva los mejores espacios deportivos de la ciudad.
          </p>
        </div>
        <div className="text-right border-l-2 border-[#22c55e] pl-4">
          <p className="text-xs text-muted-foreground mb-1">Canchas activas</p>
          <p className="text-4xl font-bold text-foreground">
            {allCourts.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {courts.length} coinciden con tu búsqueda
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4">
        {/* Sport Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href={buildHref(currentParams, { sport: undefined })}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              !sport
                ? "bg-[#22c55e] text-white"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <span className={!sport ? "bg-white/20 p-1 rounded-sm" : ""}>
              <Zap size={14} className={!sport ? "fill-white" : ""} />
            </span>
            Todos
          </Link>
          {SPORT_TYPES.map((s) => (
            <Link
              key={s.value}
              href={buildHref(currentParams, { sport: s.value })}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap ${
                sport === s.value
                  ? "bg-[#22c55e] text-white"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span
                className={
                  sport === s.value
                    ? "text-white/80 text-xs"
                    : "text-muted-foreground/60 text-xs"
                }
              >
                〽
              </span>
              {s.label}
            </Link>
          ))}
        </div>

        <div className="h-px bg-border w-full"></div>

        <FiltersBar date={selectedDate} maxPrice={selectedMaxPrice} />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Courts list */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {courts.length} canchas disponibles
          </h2>
        </div>

        {!error && courts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ninguna cancha coincide con estos filtros.{" "}
            <Link href="/explorar" className="text-[#22c55e] font-semibold hover:underline">
              Quitar filtros
            </Link>
            .
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => {
            const courtColor =
              SPORT_COLORS[court.sportType.toLowerCase()] || "bg-[#22c55e]";
            const slotCount = availabilityByCourtId.get(court.id) ?? 0;
            const reviews = reviewsByCourtId.get(court.id) ?? [];
            const averageRating = reviews.length
              ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
              : null;

            return (
              <article
                key={court.id}
                className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header Illustration */}
                <div
                  className={`${courtColor} h-32 p-3 relative flex flex-col justify-between group`}
                >
                  <div className="bg-white/20 w-max text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
                    <span className="opacity-70">〽</span>
                    {sportLabel(court.sportType)}
                  </div>

                  <div className="absolute inset-x-6 top-10 bottom-6 border border-white/30 rounded-sm"></div>
                  <div className="absolute left-1/2 top-10 bottom-6 w-px bg-white/30"></div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">
                        {court.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} />
                        Hasta {court.capacity} personas
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {averageRating ? `${averageRating.toFixed(1)} (${reviews.length})` : "Sin reseñas aún"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground leading-none mb-1">
                        desde
                      </p>
                      <p className="text-lg font-bold text-foreground leading-none">
                        S/ {court.basePricePerHour}
                      </p>
                      <p className="text-[10px] text-muted-foreground">/ hora</p>
                    </div>
                  </div>

                  <div className="h-px bg-border w-full mb-4"></div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          slotCount > 0 ? "bg-[#22c55e]" : "bg-destructive"
                        }`}
                      ></span>
                      {slotCount > 0
                        ? `${slotCount} horarios el ${selectedDate}`
                        : "Sin horarios ese día"}
                    </p>
                    <Link
                      href={`/reservas/nueva?courtId=${court.id}&date=${selectedDate}`}
                      className="flex items-center gap-1 rounded-lg bg-[#22c55e] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Ver horarios
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
