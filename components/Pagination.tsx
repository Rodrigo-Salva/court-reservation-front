import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  basePath: string;
  page: number; // base 0, como devuelve la API
  totalPages: number;
  totalElements: number;
  params?: Record<string, string | undefined>;
  pageParam?: string;
};

/** Enlaces anterior/siguiente que conservan los filtros de la URL. Se renderiza en el servidor. */
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

  const linkClass = "inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold hover:bg-secondary";
  const disabledClass = "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold opacity-40";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Página {page + 1} de {totalPages} · {totalElements} resultado(s)
      </p>
      <div className="flex gap-2">
        {page > 0 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}><ChevronLeft size={14} />Anterior</Link>
        ) : (
          <span className={disabledClass}><ChevronLeft size={14} />Anterior</span>
        )}
        {page + 1 < totalPages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>Siguiente<ChevronRight size={14} /></Link>
        ) : (
          <span className={disabledClass}>Siguiente<ChevronRight size={14} /></span>
        )}
      </div>
    </nav>
  );
}
