import "server-only";
import type { BookingResponseDTO, CourtResponseDTO } from "@/lib/definitions";

// Debe coincidir con app.business-rules.booking.operation-{start,end}-time
// en application.yml del backend (06:00 a 23:00 = 17 horas).
const OPERATING_HOURS_PER_DAY = 17;
const CHARGEABLE_STATUSES = new Set(["CONFIRMADA", "COMPLETADA"]);

function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh + em / 60 - (sh + sm / 60);
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type DayOccupancy = {
  label: string;
  iso: string;
  occupancyPercent: number;
};

export function computeAdminStats({
  bookings,
  courts,
  activeUsers,
}: {
  bookings: BookingResponseDTO[];
  courts: CourtResponseDTO[];
  activeUsers: number | null;
}) {
  const today = toISODate(new Date());
  const activeCourtCount = courts.filter((c) => c.active).length || 1;

  const chargeable = bookings.filter((b) => CHARGEABLE_STATUSES.has(b.status));

  const todayBookings = bookings.filter((b) => b.bookingDate === today);
  const todayPending = todayBookings.filter((b) => b.status === "PENDIENTE").length;

  const bookedHoursToday = chargeable
    .filter((b) => b.bookingDate === today)
    .reduce((sum, b) => sum + hoursBetween(b.startTime, b.endTime), 0);
  const occupancyToday = Math.min(
    100,
    Math.round((bookedHoursToday / (activeCourtCount * OPERATING_HOURS_PER_DAY)) * 100)
  );

  const currentMonth = today.slice(0, 7); // yyyy-MM
  const revenueThisMonth = chargeable
    .filter((b) => b.bookingDate.startsWith(currentMonth))
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Ocupacion por dia: los ultimos 7 dias, terminando hoy.
  const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
  const last7Days: DayOccupancy[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = toISODate(d);
    const bookedHours = chargeable
      .filter((b) => b.bookingDate === iso)
      .reduce((sum, b) => sum + hoursBetween(b.startTime, b.endTime), 0);
    const occupancyPercent = Math.min(
      100,
      Math.round((bookedHours / (activeCourtCount * OPERATING_HOURS_PER_DAY)) * 100)
    );
    return { label: DAY_LABELS[d.getDay()], iso, occupancyPercent };
  });

  const recentActivity = [...bookings]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  return {
    occupancyToday,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    todayBookingsCount: todayBookings.length,
    todayPending,
    activeUsers,
    last7Days,
    recentActivity,
  };
}
