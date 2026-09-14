"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { MEMBERSHIP_TYPES, type UserResponseDTO } from "@/lib/definitions";

export function ProfileForm({ user }: { user: UserResponseDTO }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="font-display text-lg font-bold text-foreground">
        Editar datos
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={user.name}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            disabled
            defaultValue={user.email}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            El email no se puede cambiar por ahora.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            required
            defaultValue={user.phone}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
          {state?.fieldErrors?.phone && (
            <p className="text-xs text-destructive">{state.fieldErrors.phone}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="membershipType"
            className="text-sm font-medium text-foreground"
          >
            Membresía
          </label>
          <select
            id="membershipType"
            name="membershipType"
            defaultValue={user.membershipType}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          >
            {MEMBERSHIP_TYPES.map((membership) => (
              <option key={membership.value} value={membership.value}>
                {membership.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-[#dcfce7] px-3 py-2 text-sm text-[#166534]">
          Perfil actualizado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
