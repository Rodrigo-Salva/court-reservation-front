import { CalendarClock, Percent, Trophy } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { ProfileForm } from "@/components/ProfileForm";
import { Avatar, Notice, PageHeader, StatCard, StatusPill, cardClass } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { MEMBERSHIP_TYPES, type UserResponseDTO } from "@/lib/definitions";

const membershipLabel = (value: string) => MEMBERSHIP_TYPES.find((membership) => membership.value === value)?.label ?? value;
const ROLE_LABEL: Record<string, string> = {
  USER: "Jugador",
  RECEPTIONIST: "Recepción",
  VENUE_ADMIN: "Admin de sede",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super administrador",
};

export default async function PerfilPage() {
  const session = await getSession();

  let user: UserResponseDTO | null = null;
  let error: string | null = null;
  try {
    user = await apiFetch<UserResponseDTO>(`/api/users/${session!.userId}`, { token: session!.token });
  } catch (err) {
    error = err instanceof ApiError ? err.message : "No se pudo cargar tu perfil.";
  }

  if (error || !user) {
    return <Notice tone="error">{error ?? "No se pudo cargar tu perfil."}</Notice>;
  }

  const isPlayer = session!.role === "USER";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Tus datos personales y los beneficios de tu membresía." />

      <section className={`${cardClass} flex flex-wrap items-center gap-5 p-6`}>
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xl font-bold text-emerald-800" aria-hidden>
          {user.name.substring(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-2xl font-bold">{user.name}</h2>
            <StatusPill tone={isPlayer ? "info" : "warning"}>{ROLE_LABEL[session!.role] ?? session!.role}</StatusPill>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Avatar name={user.name} />Miembro desde {shortDate(user.registrationDate)}{user.venueName ? ` · ${user.venueName}` : ""}</p>
        </div>
      </section>

      {isPlayer && (
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Beneficios">
          <StatCard icon={Trophy} tone="amber" label="Membresía" value={membershipLabel(user.membershipType)} />
          <StatCard icon={Percent} tone="green" label="Descuento" value={`${Math.round(user.membershipDiscount * 100)}%`} hint="en cada reserva" />
          <StatCard icon={CalendarClock} tone="blue" label="Anticipación" value={`${user.maxDaysAdvance} días`} hint="para reservar" />
        </section>
      )}

      <ProfileForm user={user} />
    </div>
  );
}
