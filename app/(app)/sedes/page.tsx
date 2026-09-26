import { ConfirmButton } from "@/components/forms";
import { redirect } from "next/navigation";
import { ArrowRightLeft, Building2, MapPin, Phone, Power, Search, Trophy, Warehouse } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { moveCourt, saveVenue, toggleVenue } from "@/app/actions/venues";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, Notice, PageHeader, StatCard, StatusPill, cardClass, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { sportLabel } from "@/lib/sport";
import type { CourtResponseDTO, VenueResponseDTO } from "@/lib/definitions";

const VENUES_PER_PAGE = 5;
const GROUPS_PER_PAGE = 4;

const norm = (text: string | null | undefined) => (text ?? "").toLowerCase();

export default async function SedesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; moved?: string; q?: string; vpage?: string; gpage?: string }>;
}) {
  const s = await getSession();
  if (!s || !["ADMIN", "SUPER_ADMIN"].includes(s.role)) redirect("/explorar");
  const p = await searchParams;
  const term = norm(p.q?.trim());

  let venues: VenueResponseDTO[] = [];
  let courts: CourtResponseDTO[] = [];
  try { venues = await apiFetch<VenueResponseDTO[]>("/api/venues/all", { token: s.token }); } catch { /* Se muestra la lista vacía. */ }
  try { courts = await apiFetch<CourtResponseDTO[]>("/api/courts/all", { token: s.token }); } catch { /* Se muestra la lista vacía. */ }

  const activeVenues = venues.filter((v) => v.active);
  const courtsByVenue = (venueId: number | null) => courts.filter((c) => (c.venueId ?? null) === venueId);
  const withoutVenue = courtsByVenue(null);

  const visibleVenues = venues.filter((v) => !term || norm(v.name).includes(term) || norm(v.address).includes(term));
  const venuePage = paginate(visibleVenues, p.vpage, VENUES_PER_PAGE);

  const groups = [
    ...venues.map((v) => ({ key: String(v.id), venueId: v.id as number | null, title: v.name, subtitle: v.address, active: v.active, courts: courtsByVenue(v.id) })),
    ...(withoutVenue.length > 0
      ? [{ key: "none", venueId: null as number | null, title: "Sin sede asignada", subtitle: "Estas canchas no son visibles para el personal de ninguna sede.", active: true, courts: withoutVenue }]
      : []),
  ].filter((g) => !term || norm(g.title).includes(term) || g.courts.some((c) => norm(c.name).includes(term)));
  const groupPage = paginate(groups, p.gpage, GROUPS_PER_PAGE);

  const keep = { q: p.q, vpage: String(venuePage.page || ""), gpage: String(groupPage.page || "") };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Organización" title="Sedes" description="Administra las ubicaciones donde operan las canchas y reparte las canchas entre ellas." />

      {p.success && <Notice tone="success">Sede guardada correctamente.</Notice>}
      {p.moved && <Notice tone="success">Cancha movida correctamente.</Notice>}
      {p.error && <Notice tone="error">{p.error}</Notice>}

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen">
        <StatCard icon={Building2} label="Sedes activas" value={`${activeVenues.length} de ${venues.length}`} hint="registradas en el sistema" />
        <StatCard icon={Trophy} tone="blue" label="Canchas" value={String(courts.length)} hint={`${courts.filter((c) => c.active).length} activas`} />
        <StatCard icon={Warehouse} tone={withoutVenue.length > 0 ? "amber" : "slate"} label="Sin sede" value={String(withoutVenue.length)} hint={withoutVenue.length > 0 ? "requieren asignación" : "todas asignadas"} />
      </section>

      <form className={`${cardClass} flex gap-2 p-4`}>
        <label className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={p.q ?? ""} placeholder="Buscar sede, dirección o cancha" aria-label="Buscar" className={`${inputClass} pl-9`} />
        </label>
        <button className={primaryButton}>Buscar</button>
      </form>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form action={saveVenue} className={`${cardClass} flex flex-col gap-4 p-5 lg:col-span-2`}>
          <div>
            <h2 className="font-display text-xl font-bold">Nueva sede</h2>
            <p className="text-sm text-muted-foreground">Luego podrás asignarle canchas y personal.</p>
          </div>
          <label className="text-sm font-semibold">Nombre<input required name="name" maxLength={100} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <label className="text-sm font-semibold">Dirección<input required name="address" maxLength={200} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <label className="text-sm font-semibold">Teléfono<input name="phone" maxLength={30} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <ConfirmButton message="Se creará la nueva sede." confirmLabel="Sí, crear" className={primaryButton}>Crear sede</ConfirmButton>
        </form>

        <section className={`${cardClass} flex flex-col lg:col-span-3`}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-xl font-bold">Sedes registradas</h2>
            <span className="text-xs text-muted-foreground">{visibleVenues.length} resultado(s)</span>
          </div>
          {venuePage.items.length === 0 ? (
            <div className="p-6"><EmptyState icon={Building2} title="No hay sedes" description="Crea la primera sede con el formulario o cambia la búsqueda." /></div>
          ) : (
            <ul className="divide-y divide-border">
              {venuePage.items.map((v) => (
                <li key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-emerald-800"><Building2 size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="truncate">{v.name}</span>
                      <StatusPill tone={v.active ? "success" : "neutral"}>{v.active ? "Activa" : "Inactiva"}</StatusPill>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{v.address}</span>
                      {v.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{v.phone}</span>}
                      <span>{courtsByVenue(v.id).length} cancha(s)</span>
                    </p>
                  </div>
                  <form action={toggleVenue}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="active" value={String(v.active)} />
                    <ConfirmButton message={v.active ? "La sede dejará de estar disponible para reservas." : "La sede volverá a estar disponible para reservas."} confirmLabel={v.active ? "Sí, desactivar" : "Sí, activar"} className={secondaryButton} title={v.active ? "Desactivar sede" : "Activar sede"}><Power size={13} />{v.active ? "Desactivar" : "Activar"}</ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto border-t border-border p-4">
            <Pagination basePath="/sedes" pageParam="vpage" page={venuePage.page} totalPages={venuePage.totalPages} totalElements={venuePage.totalElements} params={{ q: p.q, gpage: keep.gpage }} />
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Canchas por sede</h2>
          <p className="text-sm text-muted-foreground">Mueve una cancha a otra sede con el selector de cada fila.</p>
        </div>

        {groupPage.items.length === 0 ? (
          <EmptyState icon={Warehouse} title="Sin resultados" description="Ninguna sede ni cancha coincide con la búsqueda." />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {groupPage.items.map((group) => (
              <article key={group.key} className={`${cardClass} overflow-hidden`}>
                <header className="flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3.5">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{group.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">{group.subtitle}</p>
                  </div>
                  <StatusPill tone={group.venueId === null ? "warning" : "info"}>{group.courts.length} cancha(s)</StatusPill>
                </header>
                {group.courts.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground">Esta sede aún no tiene canchas.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {group.courts.map((court) => (
                      <li key={court.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            <span className="truncate">{court.name}</span>
                            {!court.active && <StatusPill>Inactiva</StatusPill>}
                          </p>
                          <p className="text-xs text-muted-foreground">{sportLabel(court.sportType)} · S/ {court.basePricePerHour}/h</p>
                        </div>
                        <form action={moveCourt} className="flex items-center gap-2">
                          <input type="hidden" name="courtId" value={court.id} />
                          <select required name="venueId" defaultValue="" aria-label={`Mover ${court.name} a`} className={`${inputClass} w-auto! py-1.5! text-xs`}>
                            <option value="" disabled>Mover a…</option>
                            {activeVenues.filter((v) => v.id !== court.venueId).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                          <ConfirmButton message="La cancha se moverá a la sede seleccionada." confirmLabel="Sí, mover" className={secondaryButton}><ArrowRightLeft size={13} />Mover</ConfirmButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}

        <Pagination basePath="/sedes" pageParam="gpage" page={groupPage.page} totalPages={groupPage.totalPages} totalElements={groupPage.totalElements} params={{ q: p.q, vpage: keep.vpage }} />
      </section>
    </div>
  );
}
