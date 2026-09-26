import { ConfirmButton } from "@/components/forms";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brackets, CalendarDays, MapPin, Play, Search, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { createTournament, generateFixtures } from "@/app/actions/tournaments";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, FilterTabs, Notice, PageHeader, StatusPill, cardClass, inputClass, primaryButton, secondaryButton, type PillTone } from "@/components/ui";
import { sportLabel } from "@/lib/sport";
import { SPORT_TYPES, type TournamentDTO, type VenueResponseDTO } from "@/lib/definitions";

const PER_PAGE = 6;
const STATUS: Record<TournamentDTO["status"], { label: string; tone: PillTone }> = {
  INSCRIPCION: { label: "Inscripción abierta", tone: "success" },
  EN_CURSO: { label: "En curso", tone: "warning" },
  FINALIZADO: { label: "Finalizado", tone: "neutral" },
};
const TABS = [
  { label: "Todos", value: "" },
  { label: "Inscripción", value: "INSCRIPCION" },
  { label: "En curso", value: "EN_CURSO" },
  { label: "Finalizados", value: "FINALIZADO" },
] as const;

const today = () => new Date().toISOString().slice(0, 10);
const prettyDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

export default async function TorneosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string; q?: string; tpage?: string }>;
}) {
  const s = await getSession();
  if (!s || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(s.role)) redirect("/explorar");
  const p = await searchParams;
  const term = (p.q ?? "").trim().toLowerCase();

  let tournaments: TournamentDTO[] = [];
  try { tournaments = await apiFetch<TournamentDTO[]>("/api/tournaments", { token: s.token }); } catch { /* Se muestra el estado vacío. */ }
  let venues: VenueResponseDTO[] = [];
  if (s.role !== "VENUE_ADMIN") {
    try { venues = await apiFetch<VenueResponseDTO[]>("/api/venues/all", { token: s.token }); } catch { /* Sin selector de sede. */ }
  }

  const counts = Object.fromEntries(TABS.map((tab) => [tab.value, tab.value ? tournaments.filter((t) => t.status === tab.value).length : tournaments.length]));
  const filtered = tournaments
    .filter((t) => !p.status || t.status === p.status)
    .filter((t) => !term || t.name.toLowerCase().includes(term))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const view = paginate(filtered, p.tpage, PER_PAGE);

  const tabHref = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (p.q?.trim()) params.set("q", p.q.trim());
    const text = params.toString();
    return text ? `/torneos?${text}` : "/torneos";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Operación" title="Torneos" description="Crea torneos, genera el fixture cuando cierre la inscripción y registra los resultados." />

      {p.success && <Notice tone="success">Torneo creado correctamente.</Notice>}
      {p.error && <Notice tone="error">{p.error}</Notice>}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form action={createTournament} className={`${cardClass} flex flex-col gap-4 p-5`}>
          <div>
            <h2 className="font-display text-xl font-bold">Nuevo torneo</h2>
            <p className="text-sm text-muted-foreground">Formato todos contra todos.</p>
          </div>
          <label className="text-sm font-semibold">Nombre<input required name="name" maxLength={100} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">Deporte
              <select name="sportType" className={`${inputClass} mt-1.5 font-normal`}>
                {SPORT_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Máx. jugadores<input required defaultValue="8" name="maxParticipants" type="number" min="2" max="64" className={`${inputClass} mt-1.5 font-normal`} /></label>
          </div>
          <label className="text-sm font-semibold">Fecha de inicio<input required name="startDate" type="date" min={today()} className={`${inputClass} mt-1.5 font-normal`} /></label>
          {s.role !== "VENUE_ADMIN" && (
            <label className="text-sm font-semibold">Sede
              <select name="venueId" defaultValue="" className={`${inputClass} mt-1.5 font-normal`}>
                <option value="">Todas las sedes (global)</option>
                {venues.filter((v) => v.active).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
          )}
          <ConfirmButton message="Se creará el torneo." confirmLabel="Sí, crear" className={primaryButton}>Crear torneo</ConfirmButton>
        </form>

        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <FilterTabs items={TABS.map((tab) => ({ label: tab.label, href: tabHref(tab.value), active: (p.status ?? "") === tab.value, count: counts[tab.value] }))} />
            <form className="flex min-w-56 flex-1 gap-2 sm:max-w-xs">
              {p.status && <input type="hidden" name="status" value={p.status} />}
              <label className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input name="q" defaultValue={p.q ?? ""} placeholder="Buscar torneo" aria-label="Buscar torneo" className={`${inputClass} pl-9`} />
              </label>
            </form>
          </div>

          {view.items.length === 0 ? (
            <EmptyState icon={Brackets} title="No hay torneos" description="Crea el primero con el formulario o cambia el filtro." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {view.items.map((t) => (
                <article key={t.id} className={`${cardClass} flex flex-col gap-3 p-5 transition hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-emerald-800"><Brackets size={19} /></span>
                    <StatusPill tone={STATUS[t.status].tone}>{STATUS[t.status].label}</StatusPill>
                  </div>
                  <div>
                    <h3 className="font-bold leading-snug">{t.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{sportLabel(t.sportType)}</p>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><CalendarDays size={13} />Inicio {prettyDate(t.startDate)}</li>
                    <li className="flex items-center gap-2"><MapPin size={13} />{t.venueName ?? "Todas las sedes"}</li>
                    <li className="flex items-center gap-2"><Users size={13} />Hasta {t.maxParticipants} jugadores</li>
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link href={`/torneos/${t.id}`} className={secondaryButton}>Ver detalle</Link>
                    {t.status === "INSCRIPCION" && (
                      <form action={generateFixtures}>
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmButton message="Se generarán los cruces. Esta acción no se puede repetir." confirmLabel="Sí, generar" className={secondaryButton}><Play size={12} />Generar fixture</ConfirmButton>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination basePath="/torneos" pageParam="tpage" page={view.page} totalPages={view.totalPages} totalElements={view.totalElements} params={{ status: p.status, q: p.q }} />
        </section>
      </div>
    </div>
  );
}
