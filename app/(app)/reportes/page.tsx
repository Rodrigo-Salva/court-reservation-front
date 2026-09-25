import { redirect } from "next/navigation";
import { Download, TrendingUp, Users, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { BarList, ColumnChart, Donut, TrendChart } from "@/components/charts";
import { sportLabel } from "@/lib/sport";
import { SPORT_TYPES, type CourtResponseDTO, type OperationalReportResponseDTO, type VenueResponseDTO } from "@/lib/definitions";

type Params = { from?: string; to?: string; venueId?: string; courtId?: string; sportType?: string };

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const money = (value: number) => `S/ ${Number(value).toFixed(2)}`;
const selectClass = "mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm";

export default async function ReportesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  if (!session || !(["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] as string[]).includes(session.role)) redirect("/explorar");
  const isGlobalAdmin = session.role !== "VENUE_ADMIN";
  const params = await searchParams;
  const startDate = params.from ?? dateOffset(-30);
  const endDate = params.to ?? dateOffset(0);

  const query = new URLSearchParams({ startDate, endDate });
  if (isGlobalAdmin && params.venueId) query.set("venueId", params.venueId);
  if (params.courtId) query.set("courtId", params.courtId);
  if (params.sportType) query.set("sportType", params.sportType);

  const [reportResult, courtsResult, venuesResult] = await Promise.allSettled([
    apiFetch<OperationalReportResponseDTO>(`/api/reports/operational?${query}`, { token: session.token }),
    apiFetch<CourtResponseDTO[]>("/api/courts/all", { token: session.token }),
    isGlobalAdmin ? apiFetch<VenueResponseDTO[]>("/api/venues/all", { token: session.token }) : Promise.resolve([] as VenueResponseDTO[]),
  ]);
  const report = reportResult.status === "fulfilled" ? reportResult.value : null;
  const error = reportResult.status === "rejected"
    ? (reportResult.reason instanceof ApiError ? reportResult.reason.message : "No se pudo generar el reporte.")
    : null;
  const courts = courtsResult.status === "fulfilled" ? courtsResult.value : [];
  const venues = venuesResult.status === "fulfilled" ? venuesResult.value : [];

  const exportQuery = new URLSearchParams({ from: startDate, to: endDate });
  if (isGlobalAdmin && params.venueId) exportQuery.set("venueId", params.venueId);
  if (params.courtId) exportQuery.set("courtId", params.courtId);
  if (params.sportType) exportQuery.set("sportType", params.sportType);
  const exportHref = (format: string) => `/reportes/export?${exportQuery}&format=${format}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Administración</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Reportes operativos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresos, ocupación, cancelaciones y horas con mayor demanda.</p>
        </div>
        {report && (
          <div className="flex gap-2">
            {(["pdf", "xlsx", "csv"] as const).map((format) => (
              <a key={format} href={exportHref(format)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold uppercase hover:bg-secondary">
                <Download size={16} />{format}
              </a>
            ))}
          </div>
        )}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="text-sm font-medium">Desde<input type="date" name="from" defaultValue={startDate} className={selectClass} /></label>
        <label className="text-sm font-medium">Hasta<input type="date" name="to" defaultValue={endDate} className={selectClass} /></label>
        {isGlobalAdmin && (
          <label className="text-sm font-medium">Sede
            <select name="venueId" defaultValue={params.venueId ?? ""} className={selectClass}>
              <option value="">Todas</option>
              {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm font-medium">Cancha
          <select name="courtId" defaultValue={params.courtId ?? ""} className={selectClass}>
            <option value="">Todas</option>
            {courts.map((court) => <option key={court.id} value={court.id}>{court.name}{court.venueName ? ` · ${court.venueName}` : ""}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Deporte
          <select name="sportType" defaultValue={params.sportType ?? ""} className={selectClass}>
            <option value="">Todos</option>
            {SPORT_TYPES.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}
          </select>
        </label>
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Aplicar</button>
      </form>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {report && (
        <>
          <p className="text-xs text-muted-foreground">{report.scope}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={<TrendingUp size={18} />} label="Ingresos" value={money(report.revenue)} />
            <Metric icon={<Users size={18} />} label="Reservas" value={String(report.totalBookings)} detail={`${report.completedBookings} completadas`} />
            <Metric icon={<XCircle size={18} />} label="Cancelaciones" value={`${report.cancellationRate}%`} detail={`${report.cancelledBookings} canceladas`} />
            <Metric icon={<XCircle size={18} />} label="No show" value={String(report.noShows)} detail="reservas sin asistencia" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Reservas por día">
              <TrendChart ariaLabel="Reservas por día" data={report.daily.map((day) => ({ label: day.date, value: day.bookings }))} />
            </Panel>
            <Panel title="Ingresos por día">
              <TrendChart ariaLabel="Ingresos por día" format={(value) => `S/ ${value}`} data={report.daily.map((day) => ({ label: day.date, value: Number(day.revenue) }))} />
            </Panel>
            <Panel title="Ingresos por cancha">
              {report.byCourt.length === 0 ? <Empty /> : (
                <BarList items={report.byCourt.slice(0, 8).map((court) => ({
                  label: court.courtName,
                  sublabel: court.venueName ?? undefined,
                  value: Number(court.revenue),
                  display: `${money(court.revenue)} · ${court.bookings} res.`,
                }))} />
              )}
            </Panel>
            <Panel title="Reservas por deporte">
              {report.bySport.length === 0 ? <Empty /> : (
                <Donut centerLabel="reservas" items={report.bySport.map((sport) => ({ label: sportLabel(sport.sportType), value: sport.bookings }))} />
              )}
            </Panel>
          </div>

          <Panel title="Horas con mayor demanda">
            {report.peakHours.length === 0 ? <Empty /> : <ColumnChart items={report.peakHours.map((hour) => ({ label: hour.hour, value: hour.bookings }))} />}
          </Panel>
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Sin datos para los filtros seleccionados.</p>;
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-sm font-medium text-muted-foreground">{label}</span></div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </article>
  );
}
