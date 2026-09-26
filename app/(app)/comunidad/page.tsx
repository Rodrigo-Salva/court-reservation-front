import { ConfirmButton } from "@/components/forms";
import Link from "next/link";
import { CalendarDays, Brackets, Megaphone, MapPin, Swords, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { createOpenMatch, enrollTournament, joinOpenMatch, respondJoinRequest } from "@/app/actions/community";
import { Pagination, paginate } from "@/components/Pagination";
import { Avatar, EmptyState, FilterTabs, Notice, PageHeader, StatusPill, cardClass, inputClass, primaryButton, secondaryButton, type PillTone } from "@/components/ui";
import { hhmm, shortDate } from "@/lib/format";
import { sportLabel } from "@/lib/sport";
import type { BookingResponseDTO, OpenMatchJoinRequestDTO, OpenMatchResponseDTO, TournamentDTO } from "@/lib/definitions";

type Params = { success?: string; error?: string; opage?: string; mpage?: string; tpage?: string; tstatus?: string };

const OPEN_PER_PAGE = 4;
const MINE_PER_PAGE = 2;
const TOURNAMENTS_PER_PAGE = 4;
const REQUEST_TONE: Record<OpenMatchJoinRequestDTO["status"], PillTone> = { PENDIENTE: "warning", ACEPTADA: "success", RECHAZADA: "danger" };
const TOURNAMENT_STATUS: Record<TournamentDTO["status"], { label: string; tone: PillTone }> = {
  INSCRIPCION: { label: "Inscripción abierta", tone: "success" },
  EN_CURSO: { label: "En curso", tone: "warning" },
  FINALIZADO: { label: "Finalizado", tone: "neutral" },
};
const TOURNAMENT_TABS = [
  { label: "Todos", value: "" },
  { label: "Inscripción", value: "INSCRIPCION" },
  { label: "En curso", value: "EN_CURSO" },
  { label: "Finalizados", value: "FINALIZADO" },
] as const;

export default async function ComunidadPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  const p = await searchParams;

  const [matchesResult, tournamentsResult] = await Promise.allSettled([
    apiFetch<OpenMatchResponseDTO[]>("/api/open-matches"),
    apiFetch<TournamentDTO[]>("/api/tournaments"),
  ]);
  const openMatches = matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const tournaments = tournamentsResult.status === "fulfilled" ? tournamentsResult.value : [];

  let bookings: BookingResponseDTO[] = [];
  let myMatches: { match: OpenMatchResponseDTO; requests: OpenMatchJoinRequestDTO[] }[] = [];
  if (session) {
    const token = session.token;
    try { bookings = await apiFetch<BookingResponseDTO[]>(`/api/bookings/user/${session.userId}`, { token }); } catch { /* La creación se oculta si no se pueden consultar reservas. */ }
    try {
      const mine = await apiFetch<OpenMatchResponseDTO[]>("/api/open-matches/mine", { token });
      myMatches = await Promise.all(mine.map(async (match) => ({
        match,
        requests: await apiFetch<OpenMatchJoinRequestDTO[]>(`/api/open-matches/${match.id}/requests`, { token }).catch(() => [] as OpenMatchJoinRequestDTO[]),
      })));
    } catch { /* El panel del creador se oculta si no se puede consultar. */ }
  }
  const publishedBookings = new Set(myMatches.map(({ match }) => match.bookingId));
  const publishable = bookings.filter((b) => b.status === "CONFIRMADA" && !publishedBookings.has(b.id));

  const openView = paginate(openMatches, p.opage, OPEN_PER_PAGE);
  const mineView = paginate(myMatches, p.mpage, MINE_PER_PAGE);
  const filteredTournaments = tournaments.filter((t) => !p.tstatus || t.status === p.tstatus).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const tournamentView = paginate(filteredTournaments, p.tpage, TOURNAMENTS_PER_PAGE);
  const tournamentCounts = Object.fromEntries(TOURNAMENT_TABS.map((tab) => [tab.value, tab.value ? tournaments.filter((t) => t.status === tab.value).length : tournaments.length]));
  const keep = (extra: Record<string, string | undefined>) => ({ opage: p.opage, mpage: p.mpage, tpage: p.tpage, tstatus: p.tstatus, ...extra });

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Comunidad Sportly" title="Encuentra tu próximo partido" description="Únete a partidos abiertos, publica los tuyos e inscríbete en torneos de tu deporte favorito." />

      {p.success && <Notice tone="success">{p.success}</Notice>}
      {p.error && <Notice tone="error">{p.error}</Notice>}

      {publishable.length > 0 && (
        <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="publicar">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-emerald-800"><Megaphone size={19} /></span>
            <div>
              <h2 id="publicar" className="font-display text-lg font-bold">Publicar un partido</h2>
              <p className="text-xs text-muted-foreground">Comparte una reserva confirmada para encontrar jugadores.</p>
            </div>
          </div>
          <form action={createOpenMatch} className="mt-5 grid gap-3 md:grid-cols-6">
            <select required name="bookingId" aria-label="Reserva" className={`${inputClass} md:col-span-3`}>
              {publishable.map((b) => <option key={b.id} value={b.id}>{b.courtName} · {shortDate(b.bookingDate)} {hhmm(b.startTime)}</option>)}
            </select>
            <input required name="maxPlayers" type="number" min="2" max="50" defaultValue="10" aria-label="Máximo de jugadores" className={`${inputClass} md:col-span-1`} />
            <ConfirmButton message="Se publicará tu partido abierto para que otros jugadores se unan." confirmLabel="Sí, publicar" className={`${primaryButton} md:col-span-2`}>Publicar partido</ConfirmButton>
            <input name="note" maxLength={300} placeholder="Nota para los jugadores (opcional)" aria-label="Nota" className={`${inputClass} md:col-span-6`} />
          </form>
        </section>
      )}

      {myMatches.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="mis-partidos">
          <div>
            <h2 id="mis-partidos" className="font-display text-2xl font-bold">Mis partidos publicados</h2>
            <p className="text-sm text-muted-foreground">Acepta o rechaza a los jugadores que piden unirse.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {mineView.items.map(({ match, requests }) => (
              <article key={match.id} className={`${cardClass} flex flex-col gap-4 p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold">{match.courtName}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays size={13} />{shortDate(match.date)} · {hhmm(match.startTime)}–{hhmm(match.endTime)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusPill tone="info"><span className="inline-flex items-center gap-1"><Users size={11} />{match.confirmedPlayers}/{match.maxPlayers}</span></StatusPill>
                    <StatusPill tone={match.status === "ABIERTO" ? "success" : "neutral"}>{match.status}</StatusPill>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Solicitudes ({requests.length})</h4>
                  {requests.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Todavía nadie pidió unirse.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-border">
                      {requests.map((request) => (
                        <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                          <span className="flex items-center gap-2.5"><Avatar name={request.name} /><span className="text-sm font-semibold">{request.name}</span><StatusPill tone={REQUEST_TONE[request.status]}>{request.status}</StatusPill></span>
                          {request.status === "PENDIENTE" && (
                            <form action={respondJoinRequest} className="flex gap-2">
                              <input type="hidden" name="matchId" value={match.id} />
                              <input type="hidden" name="requestId" value={request.id} />
                              <ConfirmButton message="Aceptarás a este jugador en tu partido." confirmLabel="Sí, aceptar" name="decision" value="accept" disabled={match.status !== "ABIERTO"} className={`${primaryButton} px-3! py-1.5! text-xs disabled:opacity-50`}>Aceptar</ConfirmButton>
                              <ConfirmButton message="Rechazarás la solicitud de este jugador." tone="danger" confirmLabel="Sí, rechazar" name="decision" value="reject" className={secondaryButton}>Rechazar</ConfirmButton>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
          <Pagination basePath="/comunidad" pageParam="mpage" page={mineView.page} totalPages={mineView.totalPages} totalElements={mineView.totalElements} params={keep({ mpage: undefined })} />
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="abiertos">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="abiertos" className="font-display text-2xl font-bold">Partidos abiertos</h2>
            <p className="text-sm text-muted-foreground">Pide unirte y el organizador te confirma.</p>
          </div>
          <span className="text-sm text-muted-foreground">{openMatches.length} disponible(s)</span>
        </div>
        {openMatches.length === 0 ? (
          <EmptyState icon={Swords} title="Aún no hay partidos abiertos" description="Publica una de tus reservas confirmadas para encontrar jugadores." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openView.items.map((match) => (
              <article key={match.id} className={`${cardClass} flex flex-col gap-3 p-5 transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold">{match.courtName}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays size={13} />{shortDate(match.date)} · {hhmm(match.startTime)}–{hhmm(match.endTime)}</p>
                  </div>
                  <StatusPill tone="info"><span className="inline-flex items-center gap-1"><Users size={11} />{match.confirmedPlayers}/{match.maxPlayers}</span></StatusPill>
                </div>
                <p className="min-h-10 text-sm text-muted-foreground">{match.note || "Partido abierto a nuevos jugadores."}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground"><Avatar name={match.creatorName} />Organiza <strong className="text-foreground">{match.creatorName}</strong></span>
                  <form action={joinOpenMatch}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <ConfirmButton message="Enviarás una solicitud para unirte a este partido." confirmLabel="Sí, unirme" disabled={match.status !== "ABIERTO"} className={`${primaryButton} px-4! py-2! disabled:opacity-50`}>Unirme</ConfirmButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
        {openMatches.length > 0 && <Pagination basePath="/comunidad" pageParam="opage" page={openView.page} totalPages={openView.totalPages} totalElements={openView.totalElements} params={keep({ opage: undefined })} />}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="torneos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="torneos" className="font-display text-2xl font-bold">Torneos</h2>
            <p className="text-sm text-muted-foreground">Compite y sube en el ranking.</p>
          </div>
          <FilterTabs items={TOURNAMENT_TABS.map((tab) => ({
            label: tab.label,
            href: `/comunidad${tab.value ? `?tstatus=${tab.value}` : ""}`,
            active: (p.tstatus ?? "") === tab.value,
            count: tournamentCounts[tab.value],
          }))} />
        </div>
        {tournamentView.items.length === 0 ? (
          <EmptyState icon={Brackets} title="No hay torneos para mostrar" description="Cuando haya torneos publicados aparecerán aquí." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tournamentView.items.map((t) => (
              <article key={t.id} className={`${cardClass} flex flex-col gap-3 p-5 transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{sportLabel(t.sportType)}</p>
                  <StatusPill tone={TOURNAMENT_STATUS[t.status].tone}>{TOURNAMENT_STATUS[t.status].label}</StatusPill>
                </div>
                <h3 className="text-lg font-bold leading-snug">{t.name}</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CalendarDays size={13} />Inicio {shortDate(t.startDate)}</li>
                  <li className="flex items-center gap-2"><MapPin size={13} />{t.venueName ?? "Todas las sedes"}</li>
                  <li className="flex items-center gap-2"><Users size={13} />Hasta {t.maxParticipants} participantes</li>
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <Link href={`/torneos/${t.id}`} className={secondaryButton}>Fixture y ranking</Link>
                  {t.status === "INSCRIPCION" && (
                    <form action={enrollTournament}>
                      <input type="hidden" name="tournamentId" value={t.id} />
                      <ConfirmButton message="Te inscribirás en este torneo." confirmLabel="Sí, inscribirme" className={`${primaryButton} px-4! py-2!`}>Inscribirme</ConfirmButton>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination basePath="/comunidad" pageParam="tpage" page={tournamentView.page} totalPages={tournamentView.totalPages} totalElements={tournamentView.totalElements} params={keep({ tpage: undefined })} />
      </section>
    </div>
  );
}
