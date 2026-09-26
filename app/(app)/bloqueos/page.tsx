import { ConfirmButton } from "@/components/forms";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban, CalendarX2, ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { createCourtBlock, removeCourtBlock } from "@/app/actions/courtBlocks";
import { EmptyState, Notice, PageHeader, StatusPill, cardClass, dangerButton, inputClass, primaryButton, secondaryButton, type PillTone } from "@/components/ui";
import type { CourtBlockResponseDTO, CourtResponseDTO } from "@/lib/definitions";

const TYPE: Record<CourtBlockResponseDTO["type"], { label: string; tone: PillTone }> = {
  MANTENIMIENTO: { label: "Mantenimiento", tone: "warning" },
  FERIADO: { label: "Feriado", tone: "info" },
  EVENTO: { label: "Evento", tone: "violet" },
};

const today = () => new Date().toISOString().slice(0, 10);
const shift = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const prettyDate = (iso: string) => {
  const text = new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default async function BloqueosPage({
  searchParams,
}: {
  searchParams: Promise<{ courtId?: string; date?: string; success?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const params = await searchParams;

  let courts: CourtResponseDTO[] = [];
  try { courts = await apiFetch<CourtResponseDTO[]>("/api/courts/all", { token: session.token }); } catch { /* El estado vacío informa que no hay canchas. */ }
  const courtId = Number(params.courtId) || courts[0]?.id || 0;
  const court = courts.find((c) => c.id === courtId);
  const date = params.date ?? today();

  let blocks: CourtBlockResponseDTO[] = [];
  if (courtId) {
    try { blocks = await apiFetch<CourtBlockResponseDTO[]>(`/api/court-blocks/court/${courtId}?date=${date}`, { token: session.token }); } catch { /* Se muestra la lista vacía. */ }
  }
  blocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const dayHref = (target: string) => `/bloqueos?courtId=${courtId}&date=${target}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Operación" title="Bloqueos de cancha" description="Evita reservas durante mantenimiento, feriados o eventos. Cada bloqueo libera el horario cuando lo eliminas." />

      {params.success && <Notice tone="success">Bloqueo creado correctamente.</Notice>}
      {params.error && <Notice tone="error">{params.error}</Notice>}

      {courts.length === 0 ? (
        <EmptyState icon={Ban} title="Aún no hay canchas" description="Primero crea una cancha para poder registrar bloqueos." />
      ) : (
        <>
          <form className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
            <label className="min-w-56 flex-1 text-sm font-semibold">Cancha
              <select name="courtId" defaultValue={courtId} className={`${inputClass} mt-1.5 font-normal`}>
                {courts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.venueName ? ` · ${c.venueName}` : ""}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Fecha
              <input name="date" type="date" defaultValue={date} className={`${inputClass} mt-1.5 font-normal`} />
            </label>
            <button className={primaryButton}>Consultar</button>
          </form>

          <div className="grid items-start gap-6 lg:grid-cols-5">
            <form action={createCourtBlock} className={`${cardClass} flex flex-col gap-4 p-5 lg:col-span-2`}>
              <div>
                <h2 className="font-display text-xl font-bold">Nuevo bloqueo</h2>
                <p className="text-sm text-muted-foreground">{court?.name} · {prettyDate(date)}</p>
              </div>
              <input type="hidden" name="courtId" value={courtId} />
              <input type="hidden" name="date" value={date} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Desde<input required name="startTime" type="time" className={`${inputClass} mt-1.5 font-normal`} /></label>
                <label className="text-sm font-semibold">Hasta<input required name="endTime" type="time" className={`${inputClass} mt-1.5 font-normal`} /></label>
              </div>
              <label className="text-sm font-semibold">Motivo
                <select name="type" className={`${inputClass} mt-1.5 font-normal`}>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="FERIADO">Feriado</option>
                  <option value="EVENTO">Evento</option>
                </select>
              </label>
              <label className="text-sm font-semibold">Detalle<input required name="reason" maxLength={300} className={`${inputClass} mt-1.5 font-normal`} placeholder="Describe el bloqueo" /></label>
              <ConfirmButton message="Se bloqueará el horario y no se podrá reservar en ese rango. ¿Deseas continuar?" confirmLabel="Sí, bloquear" className={primaryButton}><Ban size={15} />Bloquear horario</ConfirmButton>
            </form>

            <section className={`${cardClass} lg:col-span-3`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-display text-xl font-bold">Bloqueos del día</h2>
                  <p className="text-xs text-muted-foreground">{prettyDate(date)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link href={dayHref(shift(date, -1))} className={secondaryButton} aria-label="Día anterior"><ChevronLeft size={14} /></Link>
                  <Link href={dayHref(today())} className={secondaryButton}>Hoy</Link>
                  <Link href={dayHref(shift(date, 1))} className={secondaryButton} aria-label="Día siguiente"><ChevronRight size={14} /></Link>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="p-6"><EmptyState icon={CalendarX2} title="Sin bloqueos" description="Esta cancha está libre de bloqueos en la fecha seleccionada." /></div>
              ) : (
                <ul className="divide-y divide-border">
                  {blocks.map((block) => (
                    <li key={block.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums"><Clock size={14} className="text-muted-foreground" />{block.startTime.slice(0, 5)}–{block.endTime.slice(0, 5)}</span>
                      <div className="min-w-0 flex-1">
                        <StatusPill tone={TYPE[block.type].tone}>{TYPE[block.type].label}</StatusPill>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{block.reason}</p>
                      </div>
                      <form action={removeCourtBlock}>
                        <input type="hidden" name="id" value={block.id} />
                        <input type="hidden" name="courtId" value={courtId} />
                        <input type="hidden" name="date" value={date} />
                        <ConfirmButton message="Se eliminará este bloqueo y el horario volverá a estar disponible." tone="danger" confirmLabel="Sí, eliminar" className={dangerButton} aria-label="Eliminar bloqueo"><Trash2 size={13} />Eliminar</ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
