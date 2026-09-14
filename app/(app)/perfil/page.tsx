import { Trophy, Calendar, Percent } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { ProfileForm } from "@/components/ProfileForm";
import { MEMBERSHIP_TYPES, type UserResponseDTO } from "@/lib/definitions";

const membershipLabel = (value: string) =>
  MEMBERSHIP_TYPES.find((membership) => membership.value === value)?.label ??
  value;

export default async function PerfilPage() {
  const session = await getSession();

  let user: UserResponseDTO | null = null;
  let error: string | null = null;
  try {
    user = await apiFetch<UserResponseDTO>(`/api/users/${session!.userId}`, {
      token: session!.token,
    });
  } catch (err) {
    error =
      err instanceof ApiError ? err.message : "No se pudo cargar tu perfil.";
  }

  if (error || !user) {
    return (
      <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background">
          {user.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Miembro desde {user.registrationDate.slice(0, 10)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="rounded-full bg-[#fef3c7] p-2 text-[#ca8a04]">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Membresía</p>
            <p className="font-bold text-foreground">
              {membershipLabel(user.membershipType)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="rounded-full bg-[#dcfce7] p-2 text-[#166534]">
            <Percent size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Descuento</p>
            <p className="font-bold text-foreground">
              {Math.round(user.membershipDiscount * 100)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="rounded-full bg-[#dbeafe] p-2 text-[#1d4ed8]">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reserva con anticipación</p>
            <p className="font-bold text-foreground">
              hasta {user.maxDaysAdvance} días
            </p>
          </div>
        </div>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
