import { ConfirmButton } from "@/components/forms";
import { CalendarClock, Hourglass, LogOut } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { leaveWaitingList } from "@/app/actions/waitlist";
import { JoinWaitlistForm } from "@/components/JoinWaitlistForm";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, Notice, PageHeader, StatusPill, cardClass, dangerButton } from "@/components/ui";
import { dateBlock, hhmm } from "@/lib/format";
import type { CourtResponseDTO, WaitingListResponseDTO } from "@/lib/definitions";

const PAGE_SIZE = 5;

export default async function EsperaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  const { page } = await searchParams;

  let courts: CourtResponseDTO[] = [];
  try {
    courts = await apiFetch<CourtResponseDTO[]>("/api/courts", { token: session?.token });
  } catch {
    // Si falla, el formulario simplemente queda sin opciones de cancha.
  }

  let entries: WaitingListResponseDTO[] = [];
  let error: string | null = null;
  try {
    entries = await apiFetch<WaitingListResponseDTO[]>(`/api/waiting-list/user/${session!.userId}`, { token: session!.token });
  } catch (err) {
    error = err instanceof ApiError ? err.message : "No se pudo cargar tu lista de espera.";
  }

  const ordered = [...entries].sort((a, b) => `${a.desiredDate}${a.desiredStartTime}`.localeCompare(`${b.desiredDate}${b.desiredStartTime}`));
  const view = paginate(ordered, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Tu actividad" title="Lista de espera" description="Únete a la espera de un horario ocupado y te avisamos apenas se libere." />

      <JoinWaitlistForm courts={courts} />

      <section className="flex flex-col gap-4" aria-labelledby="mis-esperas">
        <h2 id="mis-esperas" className="font-display text-xl font-bold">Mis esperas <span className="text-sm font-normal text-muted-foreground">({entries.length})</span></h2>

        {error && <Notice tone="error">{error}</Notice>}
        {!error && entries.length === 0 ? (
          <EmptyState icon={Hourglass} title="No estás en ninguna lista de espera" description="Cuando un horario esté ocupado, únete arriba y te avisaremos si se libera." />
        ) : (
          <ul className="flex flex-col gap-3">
            {view.items.map((entry) => {
              const block = dateBlock(entry.desiredDate);
              return (
                <li key={entry.id} className={`${cardClass} flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5`}>
                  <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-secondary">
                    <span className="text-[10px] font-bold text-muted-foreground">{block.weekday}</span>
                    <span className="font-display text-xl font-bold leading-none">{block.day}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{block.month}</span>
                  </div>
                  <div className="min-w-0 flex-1 basis-48">
                    <h3 className="truncate font-bold">{entry.courtName}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarClock size={13} />{hhmm(entry.desiredStartTime)} – {hhmm(entry.desiredEndTime)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {entry.notified ? <StatusPill tone="success">¡Disponible! Confirma pronto</StatusPill> : <StatusPill tone="info">Posición #{entry.positionInQueue}</StatusPill>}
                    <form action={leaveWaitingList}>
                      <input type="hidden" name="id" value={entry.id} />
                      <ConfirmButton message="Saldrás de la lista de espera y perderás tu turno." tone="danger" confirmLabel="Sí, salir" className={dangerButton}><LogOut size={13} />Salir</ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!error && entries.length > 0 && <Pagination basePath="/espera" page={view.page} totalPages={view.totalPages} totalElements={view.totalElements} />}
      </section>
    </div>
  );
}
