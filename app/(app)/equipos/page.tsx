import { UsersRound } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { cancelTeamInvitation, createTeam, inviteToTeam, leaveTeam, removeTeamMember, respondTeamInvitation } from "@/app/actions/teams";
import type { TeamInvitationDTO, TeamMemberDTO, TeamResponseDTO } from "@/lib/definitions";

const inputClass = "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2";

export default async function EquiposPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const s = await getSession();
  if (!s) return null;
  const p = await searchParams;
  const token = s.token;

  const [teams, invitations] = await Promise.all([
    apiFetch<TeamResponseDTO[]>("/api/teams", { token }).catch(() => [] as TeamResponseDTO[]),
    apiFetch<TeamInvitationDTO[]>("/api/teams/invitations/mine", { token }).catch(() => [] as TeamInvitationDTO[]),
  ]);
  const details = await Promise.all(teams.map(async (team) => ({
    team,
    isOwner: team.ownerId === s.userId,
    members: await apiFetch<TeamMemberDTO[]>(`/api/teams/${team.id}/members`, { token }).catch(() => [] as TeamMemberDTO[]),
    pending: team.ownerId === s.userId
      ? await apiFetch<TeamInvitationDTO[]>(`/api/teams/${team.id}/invitations`, { token }).catch(() => [] as TeamInvitationDTO[])
      : [],
  })));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Comunidad</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Equipos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Crea tu equipo e invita a otros jugadores por email. Ellos deciden si se unen.</p>
      </div>
      {p.success && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{p.success}</p>}
      {p.error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{p.error}</p>}

      {invitations.length > 0 && (
        <section className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <h2 className="font-display text-xl font-bold">Invitaciones recibidas ({invitations.length})</h2>
          <ul className="mt-3 divide-y divide-border">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-sm"><strong>{invitation.invitedByName}</strong> te invitó al equipo <strong>{invitation.teamName}</strong></p>
                <form action={respondTeamInvitation} className="flex gap-2">
                  <input type="hidden" name="id" value={invitation.id} />
                  <button name="decision" value="accept" className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">Aceptar</button>
                  <button name="decision" value="decline" className="rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:bg-secondary">Rechazar</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={createTeam} className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Crear equipo</h2>
          <label className="mt-4 block text-sm font-semibold">Nombre<input required name="name" maxLength={80} className={inputClass} /></label>
          <label className="mt-3 block text-sm font-semibold">Descripción<textarea name="description" maxLength={300} className={`${inputClass} min-h-24`} /></label>
          <button className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground">Crear equipo</button>
        </form>

        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-bold">Mis equipos</h2>
          {details.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">Todavía no perteneces a ningún equipo.</p>
          ) : (
            <div className="grid gap-4">
              {details.map(({ team, isOwner, members, pending }) => (
                <article key={team.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <UsersRound className="mt-1 text-primary" size={22} />
                      <div>
                        <h3 className="font-bold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.description || "Sin descripción"}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-bold">{isOwner ? "Capitán/a" : "Integrante"}</span>
                  </div>

                  <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Integrantes ({members.length})</h4>
                  <ul className="mt-2 divide-y divide-border">
                    {members.map((member) => (
                      <li key={member.userId} className="flex items-center justify-between py-2 text-sm">
                        <span>{member.name}{member.role === "OWNER" && <span className="ml-2 text-xs text-muted-foreground">(capitán/a)</span>}</span>
                        {isOwner && member.role !== "OWNER" && (
                          <form action={removeTeamMember}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="userId" value={member.userId} />
                            <button className="rounded-lg border border-border px-2 py-1 text-xs font-bold hover:bg-secondary">Quitar</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isOwner && (
                    <>
                      <form action={inviteToTeam} className="mt-4 flex gap-2">
                        <input type="hidden" name="teamId" value={team.id} />
                        <input required name="email" type="email" placeholder="Email del jugador a invitar" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Invitar</button>
                      </form>
                      {pending.length > 0 && (
                        <>
                          <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Invitaciones pendientes ({pending.length})</h4>
                          <ul className="mt-2 divide-y divide-border">
                            {pending.map((invitation) => (
                              <li key={invitation.id} className="flex items-center justify-between py-2 text-sm">
                                <span>{invitation.invitedName} <span className="text-xs text-muted-foreground">{invitation.invitedEmail}</span></span>
                                <form action={cancelTeamInvitation}>
                                  <input type="hidden" name="teamId" value={team.id} />
                                  <input type="hidden" name="id" value={invitation.id} />
                                  <button className="rounded-lg border border-border px-2 py-1 text-xs font-bold hover:bg-secondary">Cancelar</button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}

                  {!isOwner && (
                    <form action={leaveTeam} className="mt-4">
                      <input type="hidden" name="teamId" value={team.id} />
                      <button className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">Abandonar equipo</button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
