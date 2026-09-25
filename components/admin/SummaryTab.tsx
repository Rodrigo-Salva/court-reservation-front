import { Activity, DollarSign, Calendar, Users } from "lucide-react";
import { BOOKING_STATUS_LABELS, type BookingResponseDTO } from "@/lib/definitions";
import type { DayOccupancy } from "@/lib/adminStats";

export function SummaryTab({
  occupancyToday,
  revenueThisMonth,
  todayBookingsCount,
  todayPending,
  activeUsers,
  last7Days,
  recentActivity,
}: {
  occupancyToday: number;
  revenueThisMonth: number;
  todayBookingsCount: number;
  todayPending: number;
  activeUsers: number | null;
  last7Days: DayOccupancy[];
  recentActivity: BookingResponseDTO[];
}) {
  const maxOccupancy = Math.max(...last7Days.map((d) => d.occupancyPercent), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Activity size={20} />}
          label="Ocupación hoy"
          value={`${occupancyToday}%`}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Ingresos del mes"
          value={`S/ ${revenueThisMonth.toLocaleString("es-PE")}`}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Reservas hoy"
          value={String(todayBookingsCount)}
          hint={todayPending > 0 ? `${todayPending} pendientes` : undefined}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Usuarios activos"
          value={activeUsers === null ? "—" : String(activeUsers)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Últimos 7 días
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">
            Ocupación por día
          </h3>

          <div className="mt-6 flex items-end justify-between gap-2 h-48">
            {last7Days.map((day) => (
              <div key={day.iso} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center">
                  <div
                    className="w-8 rounded-t-md bg-[#22c55e]"
                    style={{
                      height: `${Math.max(4, (day.occupancyPercent / maxOccupancy) * 100)}%`,
                    }}
                    title={`${day.occupancyPercent}%`}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-foreground">
            Actividad reciente
          </h3>

          <div className="mt-4 flex flex-col divide-y divide-border">
            {recentActivity.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Todavía no hay reservas.
              </p>
            )}
            {recentActivity.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 py-3">
                <div className="rounded-lg bg-accent p-2 text-accent-foreground shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {booking.courtName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.startTime} — {booking.endTime}
                  </p>
                </div>
                <StatusPill status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="rounded-xl bg-accent p-2.5 text-accent-foreground shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {hint && <p className="text-xs font-medium text-[#22c55e]">{hint}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isNegative = status === "CANCELADA" || status === "NO_SHOW";
  const isPending = status === "PENDIENTE";
  const color = isNegative
    ? "bg-destructive/10 text-destructive"
    : isPending
      ? "bg-[#fef3c7] text-[#ca8a04]"
      : "bg-[#dcfce7] text-[#166534]";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${color}`}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
