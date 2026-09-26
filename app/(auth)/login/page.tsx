"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { login } from "@/app/actions/auth";
import { PasswordField, SubmitButton, TextField } from "@/components/forms";
import { Notice } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Inicia sesión para seguir reservando.</p>
      </div>

      {next && <div className="mt-5"><Notice tone="success">Inicia sesión para continuar donde estabas.</Notice></div>}

      <form action={formAction} className="mt-7 flex flex-col gap-5" noValidate={false}>
        <input type="hidden" name="next" value={next} />

        <TextField id="email" label="Email" type="email" icon={Mail} autoComplete="email" placeholder="tu@email.com" />
        <PasswordField id="password" label="Contraseña" icon={Lock} autoComplete="current-password" placeholder="Tu contraseña" />

        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <SubmitButton pendingText="Ingresando…" className="mt-1 w-full py-3">
          <LogIn size={16} />Ingresar
        </SubmitButton>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-bold text-emerald-700 hover:underline">Regístrate gratis</Link>
      </p>
    </>
  );
}
