import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { BookingResponseDTO, OpenMatchJoinRequestDTO, OpenMatchResponseDTO, TournamentDTO } from "@/lib/definitions";
import { createOpenMatch, enrollTournament, joinOpenMatch, respondJoinRequest } from "@/app/actions/community";

const REQUEST_STYLE: Record<OpenMatchJoinRequestDTO["status"], string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  ACEPTADA: "bg-emerald-100 text-emerald-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

export default async function ComunidadPage() {
  const session = await getSession();
  const [matchesResult, tournamentsResult] = await Promise.allSettled([
    apiFetch<OpenMatchResponseDTO[]>("/api/open-matches"),
    apiFetch<TournamentDTO[]>("/api/tournaments"),
  ]);
  const matches = matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const tournaments = tournamentsResult.status === "fulfilled" ? tournamentsResult.value : [];
  let bookings: BookingResponseDTO[] = [];
  if (session) { try { bookings = await apiFetch<BookingResponseDTO[]>(`/api/bookings/user/${session.userId}`, { token: session.token }); } catch { /* La creación sigue oculta si no se pueden consultar reservas. */ } }
  const publishable = bookings.filter((booking) => booking.status === "CONFIRMADA");
  let myMatches: { match: OpenMatchResponseDTO; requests: OpenMatchJoinRequestDTO[] }[] = [];
  if (session) {
    try {
      const token = session.token;
      const mine = await apiFetch<OpenMatchResponseDTO[]>("/api/open-matches/mine", { token });
      myMatches = await Promise.all(mine.map(async (match) => ({
        match,
        requests: await apiFetch<OpenMatchJoinRequestDTO[]>(`/api/open-matches/${match.id}/requests`, { token }).catch(() => []),
      })));
    } catch { /* El panel del creador se oculta si no se puede consultar. */ }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comunidad Sportly</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-foreground">Encuentra tu próximo partido</h1>
        <p className="mt-2 text-sm text-muted-foreground">Únete a partidos abiertos o inscríbete en torneos de tu deporte favorito.</p>
      </div>

      {publishable.length > 0 && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-display text-xl font-bold">Publicar un partido</h2><p className="mt-1 text-sm text-muted-foreground">Comparte una reserva confirmada para encontrar jugadores.</p><form action={createOpenMatch} className="mt-4 grid gap-3 md:grid-cols-4"><select required name="bookingId" className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2">{publishable.map(booking => <option key={booking.id} value={booking.id}>{booking.courtName} · {booking.bookingDate} {booking.startTime.slice(0,5)}</option>)}</select><input required name="maxPlayers" type="number" min="2" max="50" defaultValue="10" className="rounded-lg border border-border bg-background px-3 py-2 text-sm"/><button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Publicar</button><input name="note" maxLength={300} placeholder="Nota para jugadores (opcional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-4"/></form></section>}

      {myMatches.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Mis partidos publicados</h2>
            <span className="text-sm text-muted-foreground">Acepta o rechaza a los jugadores</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {myMatches.map(({ match, requests }) => (
              <article key={match.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{match.courtName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{match.date} · {match.startTime.slice(0, 5)}–{match.endTime.slice(0, 5)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{match.confirmedPlayers}/{match.maxPlayers}</span>
                    <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold">{match.status}</span>
                  </div>
                </div>
                <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Solicitudes ({requests.length})</h4>
                {requests.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Todavía nadie pidió unirse.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {requests.map((request) => (
                      <li key={request.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{request.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${REQUEST_STYLE[request.status]}`}>{request.status}</span>
                        </div>
                        {request.status === "PENDIENTE" && (
                          <form action={respondJoinRequest} className="flex gap-2">
                            <input type="hidden" name="matchId" value={match.id} />
                            <input type="hidden" name="requestId" value={request.id} />
                            <button name="decision" value="accept" disabled={match.status !== "ABIERTO"} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:opacity-50">Aceptar</button>
                            <button name="decision" value="reject" className="rounded-full border border-border px-3 py-1 text-xs font-bold hover:bg-secondary">Rechazar</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Partidos abiertos</h2><span className="text-sm text-muted-foreground">{matches.length} disponibles</span></div>
        {matches.length === 0 ? <Empty text="Aún no hay partidos abiertos. Publica una de tus reservas para encontrar jugadores." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => <article key={match.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{match.courtName}</h3><p className="mt-1 text-sm text-muted-foreground">{match.date} · {match.startTime.slice(0,5)}–{match.endTime.slice(0,5)}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{match.confirmedPlayers}/{match.maxPlayers}</span></div>
              <p className="mt-4 min-h-10 text-sm text-muted-foreground">{match.note || "Partido abierto a nuevos jugadores."}</p>
              <div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">Organiza: {match.creatorName}</span><form action={joinOpenMatch}><input type="hidden" name="matchId" value={match.id}/><button disabled={match.status !== "ABIERTO"} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">Unirme</button></form></div>
            </article>)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Torneos</h2><span className="text-sm text-muted-foreground">Compite y sube en el ranking</span></div>
        {tournaments.length === 0 ? <Empty text="No hay torneos publicados por el momento." /> : (
          <div className="grid gap-4 md:grid-cols-2">{tournaments.map((tournament) => <article key={tournament.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-primary">{tournament.sportType}</p><h3 className="mt-1 text-lg font-bold">{tournament.name}</h3><p className="mt-2 text-sm text-muted-foreground">Inicio: {tournament.startDate} · Máximo {tournament.maxParticipants} participantes</p><div className="mt-4 flex items-center justify-between gap-2"><span className="rounded-full bg-secondary px-2 py-1 text-xs font-bold">{tournament.status.replace("_", " ")}</span><Link href={`/torneos/${tournament.id}`} className="text-xs font-bold text-primary hover:underline">Fixture y ranking</Link>{tournament.status === "INSCRIPCION" && <form action={enrollTournament}><input type="hidden" name="tournamentId" value={tournament.id}/><button className="rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background">Inscribirme</button></form>}</div></article>)}</div>
        )}
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">{text}</p>; }
