import { redirect } from "next/navigation";
import { Building2, Power } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { moveCourt, saveVenue, toggleVenue } from "@/app/actions/venues";
import { sportLabel } from "@/lib/sport";
import type { CourtResponseDTO, VenueResponseDTO } from "@/lib/definitions";

const inputClass = "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2";

export default async function SedesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; moved?: string }> }) {
  const s = await getSession();
  if (!s || !["ADMIN", "SUPER_ADMIN"].includes(s.role)) redirect("/explorar");
  const p = await searchParams;
  let venues: VenueResponseDTO[] = [];
  let courts: CourtResponseDTO[] = [];
  try { venues = await apiFetch<VenueResponseDTO[]>("/api/venues/all", { token: s.token }); } catch { /* Se muestra la lista vacía. */ }
  try { courts = await apiFetch<CourtResponseDTO[]>("/api/courts/all", { token: s.token }); } catch { /* Se muestra la lista vacía. */ }

  const activeVenues = venues.filter((v) => v.active);
  const groups = [
    ...venues.map((v) => ({ key: String(v.id), venueId: v.id as number | null, title: v.name, subtitle: v.address, courts: courts.filter((c) => c.venueId === v.id) })),
    { key: "none", venueId: null, title: "Sin sede asignada", subtitle: "Estas canchas no son visibles para el personal de ninguna sede.", courts: courts.filter((c) => !c.venueId) },
  ].filter((g) => g.venueId !== null || g.courts.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Organización</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Sedes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Administra las ubicaciones donde operan las canchas.</p>
      </div>
      {p.success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Sede guardada correctamente.</p>}
      {p.moved && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cancha movida correctamente.</p>}
      {p.error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{p.error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveVenue} className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Nueva sede</h2>
          <label className="mt-4 block text-sm font-semibold">Nombre<input required name="name" maxLength={100} className={inputClass} /></label>
          <label className="mt-3 block text-sm font-semibold">Dirección<input required name="address" maxLength={200} className={inputClass} /></label>
          <label className="mt-3 block text-sm font-semibold">Teléfono<input name="phone" maxLength={30} className={inputClass} /></label>
          <button className="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground">Crear sede</button>
        </form>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Sedes registradas</h2>
          <div className="mt-4 space-y-3">
            {venues.length === 0 ? <p className="text-sm text-muted-foreground">No hay sedes registradas.</p> : venues.map((v) => (
              <article key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                <div className="flex gap-3">
                  <Building2 className="text-primary" size={18} />
                  <div><p className="font-semibold">{v.name}</p><p className="text-xs text-muted-foreground">{v.address}{v.phone ? ` · ${v.phone}` : ""}</p></div>
                </div>
                <form action={toggleVenue}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="active" value={String(v.active)} />
                  <button className="rounded-lg border border-border p-2 text-xs font-bold"><Power size={15} /></button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-1 font-display text-xl font-bold">Canchas por sede</h2>
        <p className="mb-4 text-sm text-muted-foreground">Mueve una cancha a otra sede con el selector de cada fila.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <article key={group.key} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold">{group.title} <span className="text-xs font-normal text-muted-foreground">({group.courts.length})</span></h3>
              <p className="text-xs text-muted-foreground">{group.subtitle}</p>
              {group.courts.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Esta sede aún no tiene canchas.</p> : (
                <ul className="mt-3 divide-y divide-border">
                  {group.courts.map((court) => (
                    <li key={court.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <p className="text-sm font-semibold">{court.name}{!court.active && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">Inactiva</span>}</p>
                        <p className="text-xs text-muted-foreground">{sportLabel(court.sportType)} · S/ {court.basePricePerHour}</p>
                      </div>
                      <form action={moveCourt} className="flex items-center gap-2">
                        <input type="hidden" name="courtId" value={court.id} />
                        <select required name="venueId" defaultValue="" aria-label={`Mover ${court.name} a`} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
                          <option value="" disabled>Mover a…</option>
                          {activeVenues.filter((v) => v.id !== court.venueId).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary">Mover</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
