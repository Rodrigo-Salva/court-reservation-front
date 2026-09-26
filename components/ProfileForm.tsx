"use client";

import { useActionState } from "react";
import { Lock, Phone, Save, Trophy, User } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { SelectField, TextField, ConfirmButton } from "@/components/forms";
import { Notice, cardClass } from "@/components/ui";
import { MEMBERSHIP_TYPES, type UserResponseDTO } from "@/lib/definitions";

export function ProfileForm({ user }: { user: UserResponseDTO }) {
  const [state, formAction] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className={`${cardClass} flex flex-col gap-6 p-6`}>
      <div>
        <h2 className="font-display text-xl font-bold">Editar datos</h2>
        <p className="text-sm text-muted-foreground">Actualiza tu información de contacto y tu membresía.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="name" label="Nombre completo" icon={User} defaultValue={user.name} error={state?.fieldErrors?.name} />
        <TextField id="email" name="emailReadonly" label="Email" type="email" icon={Lock} defaultValue={user.email} disabled required={false} hint="El email no se puede cambiar por ahora." />
        <TextField id="phone" label="Teléfono" type="tel" inputMode="numeric" icon={Phone} defaultValue={user.phone} error={state?.fieldErrors?.phone} />
        <SelectField id="membershipType" label="Membresía" icon={Trophy} defaultValue={user.membershipType} hint="Cambia tu descuento y tus días de anticipación.">
          {MEMBERSHIP_TYPES.map((membership) => <option key={membership.value} value={membership.value}>{membership.label}</option>)}
        </SelectField>
      </div>

      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice tone="success">Perfil actualizado correctamente.</Notice>}

      <div>
        <ConfirmButton message="Se actualizarán tus datos personales y tu membresía." confirmLabel="Sí, guardar" pendingText="Guardando…"><Save size={16} />Guardar cambios</ConfirmButton>
      </div>
    </form>
  );
}
