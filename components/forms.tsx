"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Eye, EyeOff, Loader2, X, type LucideIcon } from "lucide-react";
import { inputClass } from "@/components/ui";

// Bloques de formulario compartidos: mismo aspecto, foco, errores y estado de envío en todo el proyecto.

const iconPad = "pl-10";
const invalidClass = "border-destructive/60 focus:border-destructive focus:ring-destructive/20";

/** Etiqueta + control + ayuda/error accesibles. `children` recibe los atributos aria del control. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted-foreground">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function ControlIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />;
}

type TextFieldProps = Omit<ComponentPropsWithoutRef<"input">, "id" | "name"> & {
  id: string;
  name?: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function TextField({ id, name, label, icon, hint, error, optional, wrapperClassName, className = "", ...input }: TextFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <div className="relative">
        {icon && <ControlIcon icon={icon} />}
        <input
          id={id}
          name={name ?? id}
          required={!optional}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClass} ${icon ? iconPad : ""} ${error ? invalidClass : ""} disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground ${className}`}
          {...input}
        />
      </div>
    </Field>
  );
}

export function PasswordField({ id, name, label, error, hint, icon, ...input }: Omit<TextFieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className="relative">
        {icon && <ControlIcon icon={icon} />}
        <input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClass} ${icon ? iconPad : ""} pr-11 ${error ? invalidClass : ""}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "id" | "name"> & {
  id: string;
  name?: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function SelectField({ id, name, label, icon, hint, error, optional, wrapperClassName, className = "", children, ...select }: SelectFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <div className="relative">
        {icon && <ControlIcon icon={icon} />}
        <select
          id={id}
          name={name ?? id}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${icon ? iconPad : ""} ${error ? invalidClass : ""} ${className}`}
          {...select}
        >
          {children}
        </select>
      </div>
    </Field>
  );
}

export function TextareaField({ id, name, label, hint, error, optional, wrapperClassName, className = "", ...area }: Omit<ComponentPropsWithoutRef<"textarea">, "id" | "name"> & { id: string; name?: string; label: string; hint?: string; error?: string; optional?: boolean; wrapperClassName?: string }) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <textarea id={id} name={name ?? id} aria-invalid={error ? true : undefined} className={`${inputClass} min-h-24 resize-y ${error ? invalidClass : ""} ${className}`} {...area} />
    </Field>
  );
}

/** Botón de envío que se bloquea y muestra un indicador mientras la acción del formulario está en curso. */
export function SubmitButton({
  children,
  pendingText,
  className = "",
  variant = "primary",
  pending,
  ...button
}: ComponentPropsWithoutRef<"button"> & { pendingText?: string; variant?: "primary" | "secondary" | "danger"; pending?: boolean }) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  const styles = {
    primary: "bg-primary text-primary-foreground shadow-sm hover:brightness-95",
    secondary: "border border-border bg-card hover:bg-secondary",
    danger: "bg-destructive text-white hover:brightness-95",
  }[variant];
  return (
    <button
      type="submit"
      disabled={busy || button.disabled}
      aria-busy={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...button}
    >
      {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {busy && pendingText ? pendingText : children}
    </button>
  );
}

/** Diálogo modal accesible: se cierra con Escape, con el fondo o con la X. */
export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="relative px-8 text-center">
          <h2 id={titleId} className="font-display text-xl font-bold">{title}</h2>
          {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
          <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

/** Interruptor accesible (checkbox real con estilo de switch). */
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/**
 * Botón de envío que pide confirmación antes de ejecutar la acción del formulario.
 * Va dentro de un <form>: al confirmar envía el formulario usando este botón como remitente,
 * de modo que su `name`/`value` y `formAction` se conservan.
 */
export function ConfirmButton({
  message,
  title = "¿Estás seguro?",
  confirmLabel = "Sí, continuar",
  tone = "primary",
  pendingText,
  className,
  children,
  disabled,
  ...button
}: Omit<ComponentPropsWithoutRef<"button">, "type" | "title"> & {
  message: string;
  title?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  pendingText?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  const confirm = () => {
    setOpen(false);
    const form = trigger.current?.form;
    if (form?.reportValidity()) form.requestSubmit(trigger.current);
  };

  // Valida el formulario antes de preguntar, para no confirmar algo que no se puede enviar.
  const ask = () => {
    if (trigger.current?.form?.reportValidity() !== false) setOpen(true);
  };

  const base = className ?? "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-95";

  return (
    <>
      <button ref={trigger} type="button" onClick={ask} disabled={pending || disabled} aria-busy={pending} className={`${base} disabled:cursor-not-allowed disabled:opacity-60`} {...button}>
        {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {pending && pendingText ? pendingText : children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={message}>
        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold transition hover:bg-secondary">No, volver</button>
          <button type="button" onClick={confirm} autoFocus className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-95 ${tone === "danger" ? "bg-destructive" : "bg-primary text-primary-foreground"}`}>{confirmLabel}</button>
        </div>
      </Modal>
    </>
  );
}
