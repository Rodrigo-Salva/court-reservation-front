"use client";

import { useActionState } from "react";
import Link from "next/link";
import { User, Mail, Phone, Lock, Trophy, ChevronDown } from "lucide-react";
import { register } from "@/app/actions/auth";
import { MEMBERSHIP_TYPES } from "@/lib/definitions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Crea tu cuenta
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Empieza a reservar en menos de un minuto.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <Field
          id="name"
          name="name"
          label="Nombre completo"
          icon={User}
          placeholder="Rodrigo Salva"
          defaultValue={state?.values?.name}
          error={state?.fieldErrors?.name}
        />

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state?.values?.email}
          error={state?.fieldErrors?.email}
        />

        <Field
          id="phone"
          name="phone"
          label="Teléfono"
          icon={Phone}
          placeholder="987654321"
          defaultValue={state?.values?.phone}
          error={state?.fieldErrors?.phone}
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="membershipType"
            className="text-sm font-medium text-foreground"
          >
            Membresía
          </label>
          <div className="relative">
            <Trophy
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <select
              id="membershipType"
              name="membershipType"
              defaultValue={state?.values?.membershipType ?? "NINGUNA"}
              className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
            >
              {MEMBERSHIP_TYPES.map((membership) => (
                <option key={membership.value} value={membership.value}>
                  {membership.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <Field
          id="password"
          name="password"
          label="Contraseña"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          error={state?.fieldErrors?.password}
        />

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#22c55e]/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-[#22c55e] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

function Field({
  id,
  name,
  label,
  icon: Icon,
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
