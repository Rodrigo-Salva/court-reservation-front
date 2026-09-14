import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { leaveWaitingList } from "@/app/actions/waitlist";
import { JoinWaitlistForm } from "@/components/JoinWaitlistForm";
import type { CourtResponseDTO, WaitingListResponseDTO } from "@/lib/definitions";

export default async function EsperaPage() {
  const session = await getSession();

  let courts: CourtResponseDTO[] = [];
  try {
    courts = await apiFetch<CourtResponseDTO[]>("/api/courts", {
      token: session?.token,
    });
  } catch {
    // Si falla, el formulario simplemente queda sin opciones de cancha.
  }

  let entries: WaitingListResponseDTO[] = [];
  let error: string | null = null;
  try {
    entries = await apiFetch<WaitingListResponseDTO[]>(
      `/api/waiting-list/user/${session!.userId}`,
      { token: session!.token }
    );
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "No se pudo cargar tu lista de espera.";
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Lista de espera
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Únete a la espera de un horario ocupado y te avisamos si se libera.
      </p>

      <JoinWaitlistForm courts={courts} />

      {error && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && entries.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No estás en ninguna lista de espera.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div>
              <p className="font-semibold text-foreground">{entry.courtName}</p>
              <p className="text-sm text-muted-foreground">
                {entry.desiredDate} · {entry.desiredStartTime} -{" "}
                {entry.desiredEndTime}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {entry.notified ? (
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                  ¡Cancha disponible! Confirma pronto
                </span>
              ) : (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  Posición #{entry.positionInQueue}
                </span>
              )}
              <form action={leaveWaitingList}>
                <input type="hidden" name="id" value={entry.id} />
                <button
                  type="submit"
                  className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Salir
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
