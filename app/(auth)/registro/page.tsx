"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock, Mail, Phone, Trophy, User, UserPlus } from "lucide-react";
import { register } from "@/app/actions/auth";
import { PasswordField, SelectField, SubmitButton, TextField } from "@/components/forms";
import { Notice } from "@/components/ui";
import { MEMBERSHIP_TYPES } from "@/lib/definitions";

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, undefined);

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Empieza a reservar en menos de un minuto.</p>
      </div>

      <form action={formAction} className="mt-7 flex flex-col gap-5">
        <TextField id="name" label="Nombre completo" icon={User} autoComplete="name" placeholder="Ej.: Ana Torres" defaultValue={state?.values?.name} error={state?.fieldErrors?.name} />
        <TextField id="email" label="Email" type="email" icon={Mail} autoComplete="email" placeholder="tu@email.com" defaultValue={state?.values?.email} error={state?.fieldErrors?.email} />
        <TextField id="phone" label="Teléfono" type="tel" inputMode="numeric" icon={Phone} autoComplete="tel" placeholder="987654321" hint="Entre 9 y 15 dígitos, solo números." defaultValue={state?.values?.phone} error={state?.fieldErrors?.phone} />

        <SelectField id="membershipType" label="Membresía" icon={Trophy} defaultValue={state?.values?.membershipType ?? "NINGUNA"} hint="Define tu descuento y con cuántos días de anticipación puedes reservar. Podrás cambiarla luego.">
          {MEMBERSHIP_TYPES.map((membership) => <option key={membership.value} value={membership.value}>{membership.label}</option>)}
        </SelectField>

        <PasswordField id="password" label="Contraseña" icon={Lock} autoComplete="new-password" placeholder="Mínimo 6 caracteres" minLength={6} error={state?.fieldErrors?.password} />

        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <SubmitButton pendingText="Creando cuenta…" className="mt-1 w-full py-3">
          <UserPlus size={16} />Crear cuenta
        </SubmitButton>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-emerald-700 hover:underline">Inicia sesión</Link>
      </p>
    </>
  );
}
