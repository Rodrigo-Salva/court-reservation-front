"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow, cardClass } from "@/components/ui";

/** Paginación en memoria para listas administrativas que llegan completas. */
export function usePaged<T>(items: T[], size = 8) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, totalPages - 1);
  return { items: items.slice(current * size, current * size + size), page: current, totalPages, total: items.length, setPage };
}

export function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  const base = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-bold transition";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
      <p className="text-xs text-muted-foreground">{total} resultado(s) · Página {page + 1} de {totalPages}</p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginación">
          <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} className={`${base} border-border bg-card disabled:opacity-40`} aria-label="Anterior"><ChevronLeft size={14} /></button>
          {pageWindow(page, totalPages).map((item) => (
            <button key={item} type="button" onClick={() => onPage(item)} aria-current={item === page ? "page" : undefined} className={`${base} ${item === page ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{item + 1}</button>
          ))}
          <button type="button" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} className={`${base} border-border bg-card disabled:opacity-40`} aria-label="Siguiente"><ChevronRight size={14} /></button>
        </nav>
      )}
    </div>
  );
}

/** Tarjeta contenedora de una tabla administrativa con título y acción principal. */
export function AdminCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export const thClass = "px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground";
export const tdClass = "px-5 py-3.5 align-middle";
export const rowButton = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold transition hover:bg-secondary";
