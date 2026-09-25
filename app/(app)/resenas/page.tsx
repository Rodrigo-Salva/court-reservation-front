import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { moderateReview } from "@/app/actions/reviews";
import { Pagination } from "@/components/Pagination";
import type { CourtReviewResponseDTO, PageResponse } from "@/lib/definitions";

export default async function ResenasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; filter?: string; q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const { error, filter, q, page } = await searchParams;

  const query = new URLSearchParams({ size: "10", page: String(Math.max(0, Number(page) || 0)) });
  if (filter) query.set("filter", filter);
  if (q?.trim()) query.set("q", q.trim());

  let result: PageResponse<CourtReviewResponseDTO> | null = null;
  let loadError = "";
  try {
    result = await apiFetch<PageResponse<CourtReviewResponseDTO>>(`/api/court-reviews/moderation?${query}`, { token: session.token });
  } catch {
    loadError = "No se pudieron cargar las reseñas.";
  }
  const shown: CourtReviewResponseDTO[] = result?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Administración</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Moderación de reseñas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Oculta las reseñas inapropiadas (dejan de mostrarse en Explorar) o elimínalas definitivamente. {result?.totalElements ?? 0} reseña(s) con el filtro actual.
        </p>
      </div>

      {(error || loadError) && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error || loadError}</p>}

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar por cancha, autor o comentario" className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <select name="filter" defaultValue={filter ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Todas</option>
          <option value="visible">Visibles</option>
          <option value="hidden">Ocultas</option>
        </select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Filtrar</button>
      </form>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No hay reseñas para mostrar.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((review) => (
            <article key={review.id} className={`rounded-2xl border bg-card p-5 ${review.hidden ? "border-dashed border-amber-400/60 opacity-80" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{review.courtName} <span className="text-xs font-normal text-muted-foreground">{review.venueName ? `· ${review.venueName}` : ""}</span></p>
                  <p className="mt-1 flex items-center gap-1 text-amber-500" aria-label={`${review.rating} de 5`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} className={index < review.rating ? "fill-current" : "opacity-25"} />)}
                    <span className="ml-2 text-xs text-muted-foreground">{review.userName} · {review.createdAt?.replace("T", " ").slice(0, 16)}</span>
                  </p>
                </div>
                {review.hidden && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Oculta</span>}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{review.comment || "Sin comentario."}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button name="decision" value={review.hidden ? "show" : "hide"} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary">
                    {review.hidden ? "Volver a mostrar" : "Ocultar"}
                  </button>
                </form>
                <details className="group">
                  <summary className="cursor-pointer list-none rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">Eliminar…</summary>
                  <form action={moderateReview} className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 p-2">
                    <input type="hidden" name="id" value={review.id} />
                    <span className="text-xs text-destructive">Se eliminará para siempre.</span>
                    <button name="decision" value="delete" className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-bold text-white">Confirmar</button>
                  </form>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
      {result && <Pagination basePath="/resenas" page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} params={{ filter, q }} />}
    </div>
  );
}
