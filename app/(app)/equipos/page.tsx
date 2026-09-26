import { ConfirmButton } from "@/components/forms";
import { Crown, LogOut, MailPlus, Send, UserMinus, UsersRound, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { cancelTeamInvitation, createTeam, inviteToTeam, leaveTeam, removeTeamMember, respondTeamInvitation } from "@/app/actions/teams";
import { Pagination, paginate } from "@/components/Pagination";
import { Avatar, EmptyState, Notice, PageHeader, StatusPill, cardClass, dangerButton, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import type { TeamInvitationDTO, TeamMemberDTO, TeamResponseDTO } from "@/lib/definitions";

const PAGE_SIZE = 3;

export default async function EquiposPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; page?: string }> }) {
  const s = await getSession();
  if (!s) return null;
  const p = await searchParams;
  const token = s.token;

  const [teams, invitations] = await Promise.all([
    apiFetch<TeamResponseDTO[]>("/api/teams", { token }).catch(() => [] as TeamResponseDTO[]),
    apiFetch<TeamInvitationDTO[]>("/api/teams/invitations/mine", { token }).catch(() => [] as TeamInvitationDTO[]),
  ]);
  // Solo se cargan los integrantes e invitaciones de los equipos de la página actual.
  const view = paginate(teams, p.page, PAGE_SIZE);
  const details = await Promise.all(view.items.map(async (team) => {
    const isOwner = team.ownerId === s.userId;
    return {
      team,
      isOwner,
      members: await apiFetch<TeamMemberDTO[]>(`/api/teams/${team.id}/members`, { token }).catch(() => [] as TeamMemberDTO[]),
      pending: isOwner ? await apiFetch<TeamInvitationDTO[]>(`/api/teams/${team.id}/invitations`, { token }).catch(() => [] as TeamInvitationDTO[]) : [],
    };
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Comunidad" title="Equipos" description="Crea tu equipo e invita a otros jugadores por email. Ellos deciden si se unen." />

      {p.success && <Notice tone="success">{p.success}</Notice>}
      {p.error && <Notice tone="error">{p.error}</Notice>}

      {invitations.length > 0 && (
        <section className="rounded-2xl border border-primary/40 bg-primary/5 p-5" aria-labelledby="recibidas">
          <h2 id="recibidas" className="flex items-center gap-2 font-display text-lg font-bold"><MailPlus size={18} className="text-primary" />Invitaciones recibidas ({invitations.length})</h2>
          <ul className="mt-3 divide-y divide-primary/20">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-sm"><strong>{invitation.invitedByName}</strong> te invitó al equipo <strong>{invitation.teamName}</strong></p>
                <form action={respondTeamInvitation} className="flex gap-2">
                  <input type="hidden" name="id" value={invitation.id} />
                  <ConfirmButton message="Aceptarás la invitación y te unirás al equipo." confirmLabel="Sí, aceptar" name="decision" value="accept" className={`${primaryButton} px-4! py-1.5! text-xs`}>Aceptar</ConfirmButton>
                  <ConfirmButton message="Rechazarás la invitación al equipo." tone="danger" confirmLabel="Sí, rechazar" name="decision" value="decline" className={secondaryButton}>Rechazar</ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form action={createTeam} className={`${cardClass} flex flex-col gap-4 p-5 lg:sticky lg:top-6`}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-emerald-800"><UsersRound size={19} /></span>
            <div>
              <h2 className="font-display text-lg font-bold">Crear equipo</h2>
              <p className="text-xs text-muted-foreground">Serás el capitán o la capitana.</p>
            </div>
          </div>
          <label className="text-sm font-semibold">Nombre<input required name="name" maxLength={80} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <label className="text-sm font-semibold">Descripción<textarea name="description" maxLength={300} rows={3} className={`${inputClass} mt-1.5 font-normal`} /></label>
          <ConfirmButton message="Se creará el equipo y serás su capitán." confirmLabel="Sí, crear" className={primaryButton}>Crear equipo</ConfirmButton>
        </form>

        <section className="flex flex-col gap-4 lg:col-span-2" aria-labelledby="mis-equipos">
          <h2 id="mis-equipos" className="font-display text-xl font-bold">Mis equipos <span className="text-sm font-normal text-muted-foreground">({teams.length})</span></h2>

          {teams.length === 0 ? (
            <EmptyState icon={UsersRound} title="Todavía no perteneces a ningún equipo" description="Crea el primero con el formulario o espera una invitación." />
          ) : (
            details.map(({ team, isOwner, members, pending }) => (
              <article key={team.id} className={`${cardClass} overflow-hidden`}>
                <header className="flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-emerald-800"><UsersRound size={20} /></span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">{team.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{team.description || "Sin descripción"}</p>
                    </div>
                  </div>
                  <StatusPill tone={isOwner ? "warning" : "info"}>{isOwner ? "Capitán/a" : "Integrante"}</StatusPill>
                </header>

                <div className="flex flex-col gap-5 p-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Integrantes ({members.length})</h4>
                    <ul className="mt-2 divide-y divide-border">
                      {members.map((member) => (
                        <li key={member.userId} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="flex items-center gap-2.5 text-sm font-medium">
                            <Avatar name={member.name} />{member.name}
                            {member.role === "OWNER" && <Crown size={13} className="text-amber-500" aria-label="Capitán/a" />}
                          </span>
                          {isOwner && member.role !== "OWNER" && (
                            <form action={removeTeamMember}>
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="userId" value={member.userId} />
                              <ConfirmButton message="Este integrante saldrá del equipo." tone="danger" confirmLabel="Sí, quitar" className={dangerButton}><UserMinus size={13} />Quitar</ConfirmButton>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isOwner && (
                    <div className="flex flex-col gap-3">
                      <form action={inviteToTeam} className="flex gap-2">
                        <input type="hidden" name="teamId" value={team.id} />
                        <input required name="email" type="email" placeholder="Email del jugador a invitar" aria-label="Email a invitar" className={`${inputClass} min-w-0 flex-1`} />
                        <ConfirmButton message="Se enviará la invitación a este correo." confirmLabel="Sí, invitar" className={primaryButton}><Send size={14} />Invitar</ConfirmButton>
                      </form>
                      {pending.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Invitaciones pendientes ({pending.length})</h4>
                          <ul className="mt-2 divide-y divide-border">
                            {pending.map((invitation) => (
                              <li key={invitation.id} className="flex items-center justify-between gap-3 py-2.5">
                                <span className="min-w-0 text-sm"><span className="font-medium">{invitation.invitedName}</span> <span className="text-xs text-muted-foreground">{invitation.invitedEmail}</span></span>
                                <form action={cancelTeamInvitation}>
                                  <input type="hidden" name="teamId" value={team.id} />
                                  <input type="hidden" name="id" value={invitation.id} />
                                  <ConfirmButton message="Se cancelará la invitación pendiente." tone="danger" confirmLabel="Sí, cancelar invitación" className={secondaryButton}><X size={13} />Cancelar</ConfirmButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!isOwner && (
                    <form action={leaveTeam}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <ConfirmButton message="Dejarás de ser parte de este equipo." tone="danger" confirmLabel="Sí, abandonar" className={dangerButton}><LogOut size={13} />Abandonar equipo</ConfirmButton>
                    </form>
                  )}
                </div>
              </article>
            ))
          )}

          {teams.length > 0 && <Pagination basePath="/equipos" page={view.page} totalPages={view.totalPages} totalElements={view.totalElements} />}
        </section>
      </div>
    </div>
  );
}
