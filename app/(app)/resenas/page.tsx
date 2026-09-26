import { ConfirmButton } from "@/components/forms";
import { redirect } from "next/navigation";
import { EyeOff, MessageSquareOff, Search, Star, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { moderateReview } from "@/app/actions/reviews";
import { Pagination } from "@/components/Pagination";
import { Avatar, EmptyState, FilterTabs, Notice, PageHeader, StatusPill, cardClass, dangerButton, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import type { CourtReviewResponseDTO, PageResponse } from "@/lib/definitions";

const PAGE_SIZE = 8;
const TABS = [
  { label: "Todas", value: "" },
  { label: "Visibles", value: "visible" },
  { label: "Ocultas", value: "hidden" },
] as const;

const when = (value?: string) => value?.replace("T", " ").slice(0, 10) ?? "";

export default async function ResenasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; filter?: string; q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) redirect("/explorar");
  const { error, filter, q, page } = await searchParams;
  const term = q?.trim() ?? "";

  const fetchPage = (extra: Record<string, string>) => {
    const query = new URLSearchParams(extra);
    if (term) query.set("q", term);
    return apiFetch<PageResponse<CourtReviewResponseDTO>>(`/api/court-reviews/moderation?${query}`, { token: session.token });
  };

  let result: PageResponse<CourtReviewResponseDTO> | null = null;
  let loadError = "";
  const counts: Record<string, number> = { "": 0, visible: 0, hidden: 0 };
  try {
    const listQuery: Record<string, string> = { size: String(PAGE_SIZE), page: String(Math.max(0, Number(page) || 0)) };
    if (filter) listQuery.filter = filter;
    const [list, all, visible, hidden] = await Promise.all([
      fetchPage(listQuery),
      fetchPage({ size: "1" }),
      fetchPage({ size: "1", filter: "visible" }),
      fetchPage({ size: "1", filter: "hidden" }),
    ]);
    result = list;
    counts[""] = all.totalElements;
    counts.visible = visible.totalElements;
    counts.hidden = hidden.totalElements;
  } catch {
    loadError = "No se pudieron cargar las reseñas.";
  }
  const reviews = result?.content ?? [];
  const tabHref = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("filter", value);
    if (term) params.set("q", term);
    const text = params.toString();
    return text ? `/resenas?${text}` : "/resenas";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Gestión"
        title="Moderación de reseñas"
        description="Oculta las reseñas inapropiadas (dejan de mostrarse en Explorar) o elimínalas definitivamente."
      />

      {(error || loadError) && <Notice tone="error">{error || loadError}</Notice>}

      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <FilterTabs items={TABS.map((tab) => ({ label: tab.label, href: tabHref(tab.value), active: (filter ?? "") === tab.value, count: counts[tab.value] }))} />
        <form className="flex min-w-65 flex-1 gap-2 sm:max-w-md">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <label className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input name="q" defaultValue={term} placeholder="Cancha, autor o comentario" aria-label="Buscar" className={`${inputClass} pl-9`} />
          </label>
          <button className={primaryButton}>Buscar</button>
        </form>
      </section>

      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquareOff} title="No hay reseñas para mostrar" description="Cambia el filtro o el texto de búsqueda." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className={`${cardClass} flex flex-col gap-3 p-5 ${review.hidden ? "border-dashed border-amber-300 bg-amber-50/40" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{review.courtName}</h2>
                  <p className="truncate text-xs text-muted-foreground">{review.venueName ?? "Sin sede"}</p>
                </div>
                {review.hidden ? <StatusPill tone="warning">Oculta</StatusPill> : <StatusPill tone="success">Visible</StatusPill>}
              </div>

              <div className="flex items-center gap-1 text-amber-500" role="img" aria-label={`${review.rating} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={15} className={index < review.rating ? "fill-current" : "opacity-25"} />
                ))}
                <span className="ml-1.5 text-sm font-bold text-foreground">{review.rating}.0</span>
              </div>

              <p className="min-h-10 flex-1 text-sm text-muted-foreground">{review.comment ? `“${review.comment}”` : "Sin comentario."}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar name={review.userName} />
                  <span><span className="font-semibold text-foreground">{review.userName}</span> · {when(review.createdAt)}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={moderateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <ConfirmButton name="decision" value={review.hidden ? "show" : "hide"} message={review.hidden ? "La reseña volverá a ser visible para los jugadores." : "La reseña dejará de mostrarse a los jugadores."} confirmLabel={review.hidden ? "Sí, mostrar" : "Sí, ocultar"} className={secondaryButton}>
                      <EyeOff size={13} />{review.hidden ? "Mostrar" : "Ocultar"}
                    </ConfirmButton>
                  </form>
                  <form action={moderateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <ConfirmButton name="decision" value="delete" tone="danger" message="La reseña se eliminará para siempre. Esta acción no se puede deshacer." confirmLabel="Sí, eliminar" className={dangerButton}><Trash2 size={13} />Eliminar</ConfirmButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {result && <Pagination basePath="/resenas" page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} params={{ filter, q }} />}
    </div>
  );
}
