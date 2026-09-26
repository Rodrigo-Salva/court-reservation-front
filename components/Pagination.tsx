import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/components/ui";

type PaginationProps = {
  basePath: string;
  page: number; // base 0
  totalPages: number;
  totalElements: number;
  params?: Record<string, string | undefined>;
  pageParam?: string;
};

/** Paginación por enlaces con números de página; conserva los filtros de la URL. */
export function Pagination({ basePath, page, totalPages, totalElements, params = {}, pageParam = "page" }: PaginationProps) {
  if (totalPages <= 1) {
    return <p className="text-xs text-muted-foreground">{totalElements} resultado(s)</p>;
  }

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (target > 0) query.set(pageParam, String(target));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };

  const base = "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition";
  const idle = `${base} border-border bg-card hover:bg-secondary`;
  const disabled = `${base} border-border opacity-40`;

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Página {page + 1} de {totalPages} · {totalElements} resultado(s)
      </p>
      <div className="flex items-center gap-1.5">
        {page > 0 ? (
          <Link href={hrefFor(page - 1)} className={idle} aria-label="Página anterior"><ChevronLeft size={14} />Anterior</Link>
        ) : (
          <span className={disabled}><ChevronLeft size={14} />Anterior</span>
        )}
        {pageWindow(page, totalPages).map((target) =>
          target === page ? (
            <span key={target} aria-current="page" className={`${base} border-primary bg-primary text-primary-foreground`}>{target + 1}</span>
          ) : (
            <Link key={target} href={hrefFor(target)} className={idle} aria-label={`Página ${target + 1}`}>{target + 1}</Link>
          ),
        )}
        {page + 1 < totalPages ? (
          <Link href={hrefFor(page + 1)} className={idle} aria-label="Página siguiente">Siguiente<ChevronRight size={14} /></Link>
        ) : (
          <span className={disabled}>Siguiente<ChevronRight size={14} /></span>
        )}
      </div>
    </nav>
  );
}

/** Corta una lista en memoria para pantallas cuyos datos ya vienen completos del backend. */
export function paginate<T>(items: readonly T[], rawPage: string | undefined, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(0, Number(rawPage) || 0), totalPages - 1);
  return { page, totalPages, totalElements: items.length, items: items.slice(page * size, page * size + size) };
}
