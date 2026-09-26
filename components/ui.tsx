import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

// Piezas de interfaz compartidas por las pantallas de gestión. Sin estado: se renderizan en el servidor.

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-foreground/25 focus:border-primary focus:ring-2 focus:ring-primary/25";
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-95 active:scale-[0.99]";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold transition hover:bg-secondary";
export const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3.5 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10";
export const cardClass = "rounded-2xl border border-border bg-card shadow-sm";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  const style = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-destructive/25 bg-destructive/10 text-destructive";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${style}`}>
      <Icon size={16} className="shrink-0" />
      {children}
    </p>
  );
}

const STAT_TONES = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-sky-100 text-sky-700",
  slate: "bg-secondary text-foreground",
} as const;

export function StatCard({ icon: Icon, label, value, hint, tone = "green" }: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className={`${cardClass} flex items-center gap-4 p-5`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${STAT_TONES[tone]}`}><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function FilterTabs({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <nav aria-label="Filtros" className="flex flex-wrap gap-1.5 rounded-2xl bg-secondary p-1.5">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${
            item.active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
          {item.count !== undefined && (
            <span className={`rounded-full px-1.5 text-[11px] font-bold ${item.active ? "bg-primary/20 text-emerald-800" : "bg-card text-muted-foreground"}`}>{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

const PILL_TONES = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  neutral: "bg-secondary text-muted-foreground",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function StatusPill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PILL_TONES[tone]}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground"><Icon size={22} /></span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Iniciales para avatares (máx. 2 letras). */
export function initials(name: string | undefined | null) {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name }: { name: string | undefined | null }) {
  return <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-emerald-800">{initials(name)}</span>;
}

/** Rango de páginas a mostrar (máximo 5 números) alrededor de la actual. Devuelve índices base 0. */
export function pageWindow(page: number, totalPages: number, size = 5): number[] {
  const count = Math.min(size, totalPages);
  const start = Math.max(0, Math.min(page - Math.floor(count / 2), totalPages - count));
  return Array.from({ length: count }, (_, index) => start + index);
}
