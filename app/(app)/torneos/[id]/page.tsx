import { ConfirmButton } from "@/components/forms";
import { inputClass } from "@/components/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { registerMatchResult } from "@/app/actions/tournaments";
import type { TournamentDTO, TournamentMatchDTO, TournamentRankingDTO } from "@/lib/definitions";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"];

export default async function TorneoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) notFound();

  const tournaments = await apiFetch<TournamentDTO[]>("/api/tournaments", { token: session.token }).catch(() => [] as TournamentDTO[]);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) notFound();

  const [matches, ranking] = await Promise.all([
    apiFetch<TournamentMatchDTO[]>(`/api/tournaments/${tournamentId}/matches`, { token: session.token }).catch(() => [] as TournamentMatchDTO[]),
    apiFetch<TournamentRankingDTO[]>(`/api/tournaments/${tournamentId}/ranking`, { token: session.token }).catch(() => [] as TournamentRankingDTO[]),
  ]);
  const isAdmin = ADMIN_ROLES.includes(session.role);
  const pending = matches.filter((m) => !m.completed);
  const played = matches.filter((m) => m.completed);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={isAdmin ? "/torneos" : "/comunidad"} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Volver
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">{tournament.sportType}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{tournament.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicio {tournament.startDate} · {tournament.status.replace("_", " ")} · Máximo {tournament.maxParticipants} participantes
        </p>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><Trophy size={20} className="text-primary" /> Ranking</h2>
          {ranking.length === 0 ? (
            <Empty text="Aún no hay inscritos." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Jugador</th><th className="px-3 py-2 text-right">G</th><th className="px-3 py-2 text-right">P</th><th className="px-3 py-2 text-right">Pts</th></tr>
                </thead>
                <tbody>
                  {ranking.map((row, index) => (
                    <tr key={row.userId} className={`border-t border-border ${row.userId === session.userId ? "bg-primary/5 font-semibold" : ""}`}>
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-right">{row.wins}</td>
                      <td className="px-3 py-2 text-right">{row.losses}</td>
                      <td className="px-3 py-2 text-right font-bold">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h2 className="mb-4 font-display text-xl font-bold">Fixture</h2>
            {matches.length === 0 ? (
              <Empty text={tournament.status === "INSCRIPCION" ? "El fixture se genera cuando cierra la inscripción." : "No hay partidos programados."} />
            ) : (
              <>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Por jugar ({pending.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pending.map((match) => (
                    <article key={match.id} className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-sm font-semibold">{match.playerOne} <span className="text-muted-foreground">vs</span> {match.playerTwo}</p>
                      {isAdmin && (
                        <form action={registerMatchResult} className="mt-3 flex items-center gap-2">
                          <input type="hidden" name="tournamentId" value={tournament.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <input required name="scoreOne" type="number" min="0" aria-label={`Puntos de ${match.playerOne}`} className={`${inputClass} w-16 px-2! py-1.5! text-center`} />
                          <span className="text-muted-foreground">-</span>
                          <input required name="scoreTwo" type="number" min="0" aria-label={`Puntos de ${match.playerTwo}`} className={`${inputClass} w-16 px-2! py-1.5! text-center`} />
                          <ConfirmButton message="Se registrará el resultado del partido. Revisa el marcador antes de confirmar." confirmLabel="Sí, registrar" pendingText="Guardando…" className="ml-auto inline-flex items-center rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Registrar</ConfirmButton>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
                {played.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">Jugados ({played.length})</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {played.map((match) => {
                        const oneWon = (match.scoreOne ?? 0) > (match.scoreTwo ?? 0);
                        return (
                          <article key={match.id} className="rounded-2xl border border-border bg-card p-4">
                            <div className={`flex justify-between text-sm ${oneWon ? "font-bold" : "text-muted-foreground"}`}><span>{match.playerOne}</span><span>{match.scoreOne}</span></div>
                            <div className={`mt-1 flex justify-between text-sm ${!oneWon ? "font-bold" : "text-muted-foreground"}`}><span>{match.playerTwo}</span><span>{match.scoreTwo}</span></div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">{text}</p>;
}
