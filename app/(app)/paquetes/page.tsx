import { ConfirmButton } from "@/components/forms";
import { CalendarClock, PackageOpen, Sparkles, Tag } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { purchasePackage } from "@/app/actions/packages";
import { Pagination, paginate } from "@/components/Pagination";
import { EmptyState, FilterTabs, Notice, PageHeader, StatusPill, cardClass, primaryButton } from "@/components/ui";
import type { PackageResponseDTO, UserPackageResponseDTO } from "@/lib/definitions";

const PAGE_SIZE = 6;
const SORTS = [
  { label: "Mejor precio por hora", value: "precio" },
  { label: "Mayor descuento", value: "descuento" },
  { label: "Más horas", value: "horas" },
] as const;

const soles = (value: number) => `S/ ${Number(value).toLocaleString("es-PE", { maximumFractionDigits: 2 })}`;

export default async function PaquetesPage({ searchParams }: { searchParams: Promise<{ sort?: string; page?: string; success?: string; error?: string }> }) {
  const session = await getSession();
  const { sort: rawSort, page, success, error } = await searchParams;
  const sort = SORTS.some((s) => s.value === rawSort) ? (rawSort as (typeof SORTS)[number]["value"]) : "precio";

  let packages: PackageResponseDTO[] = [];
  let packagesError: string | null = null;
  try {
    packages = await apiFetch<PackageResponseDTO[]>("/api/packages", { token: session?.token });
  } catch (err) {
    packagesError = err instanceof ApiError ? err.message : "No se pudieron cargar los paquetes.";
  }

  let myPackages: UserPackageResponseDTO[] = [];
  let myPackagesError: string | null = null;
  try {
    myPackages = await apiFetch<UserPackageResponseDTO[]>(`/api/user-packages/user/${session!.userId}/active`, { token: session!.token });
  } catch (err) {
    myPackagesError = err instanceof ApiError ? err.message : "No se pudieron cargar tus paquetes.";
  }

  const bestValue = packages.length ? Math.min(...packages.map((p) => p.pricePerHour)) : 0;
  const ordered = [...packages].sort((a, b) =>
    sort === "descuento" ? b.discountPercentage - a.discountPercentage : sort === "horas" ? b.hoursQuantity - a.hoursQuantity : a.pricePerHour - b.pricePerHour,
  );
  const view = paginate(ordered, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Ahorra en cada reserva" title="Paquetes de horas" description="Compra horas prepagadas con descuento y úsalas al reservar. Si cancelas con anticipación, las horas vuelven a tu paquete." />

      {success && <Notice tone="success">¡Compra realizada! Tu paquete ya está activo.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <section className="flex flex-col gap-4" aria-labelledby="mis-paquetes">
        <h2 id="mis-paquetes" className="font-display text-xl font-bold">Mis paquetes activos</h2>
        {myPackagesError && <Notice tone="error">{myPackagesError}</Notice>}
        {!myPackagesError && myPackages.length === 0 ? (
          <EmptyState icon={PackageOpen} title="Todavía no tienes paquetes activos" description="Elige uno de los paquetes disponibles para empezar a ahorrar." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myPackages.map((owned) => {
              const used = owned.initialHours - owned.remainingHours;
              const percent = owned.initialHours > 0 ? Math.round((owned.remainingHours / owned.initialHours) * 100) : 0;
              return (
                <article key={owned.id} className={`${cardClass} flex flex-col gap-3 p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold">{owned.packageName}</h3>
                    <StatusPill tone={owned.daysUntilExpiration <= 7 ? "warning" : "success"}>
                      <span className="inline-flex items-center gap-1"><CalendarClock size={11} />Vence en {owned.daysUntilExpiration} días</span>
                    </StatusPill>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span><strong className="font-display text-2xl">{owned.remainingHours}</strong> <span className="text-muted-foreground">de {owned.initialHours} horas disponibles</span></span>
                      <span className="text-xs text-muted-foreground">{used} usadas</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Horas restantes">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="disponibles">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="disponibles" className="font-display text-xl font-bold">Paquetes disponibles</h2>
          <FilterTabs items={SORTS.map((s) => ({ label: s.label, href: s.value === "precio" ? "/paquetes" : `/paquetes?sort=${s.value}`, active: sort === s.value }))} />
        </div>

        {packagesError && <Notice tone="error">{packagesError}</Notice>}
        {!packagesError && packages.length === 0 ? (
          <EmptyState icon={PackageOpen} title="No hay paquetes disponibles" description="Vuelve a intentarlo más tarde." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.items.map((pkg) => (
              <article key={pkg.id} className={`${cardClass} relative flex flex-col p-5 transition hover:shadow-md ${pkg.pricePerHour === bestValue ? "border-primary ring-1 ring-primary/40" : ""}`}>
                {pkg.pricePerHour === bestValue && (
                  <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground shadow-sm"><Sparkles size={10} />Mejor valor</span>
                )}
                <StatusPill tone="success"><span className="inline-flex items-center gap-1"><Tag size={11} />{Math.round(pkg.discountPercentage * 100)}% dscto.</span></StatusPill>
                <h3 className="mt-3 text-lg font-bold">{pkg.name}</h3>
                <p className="text-sm text-muted-foreground">{pkg.hoursQuantity} horas · válido {pkg.validityDays} días</p>
                <p className="mt-4 font-display text-3xl font-bold">{soles(pkg.price)}</p>
                <p className="text-sm text-muted-foreground">{soles(pkg.pricePerHour)} por hora{pkg.savings > 0 ? ` · ahorras ${soles(pkg.savings)}` : ""}</p>
                <form action={purchasePackage} className="mt-5">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <ConfirmButton message="Se realizará la compra de este paquete de horas." confirmLabel="Sí, comprar" className={`${primaryButton} w-full`}>Comprar paquete</ConfirmButton>
                </form>
              </article>
            ))}
          </div>
        )}

        {!packagesError && <Pagination basePath="/paquetes" page={view.page} totalPages={view.totalPages} totalElements={view.totalElements} params={{ sort: sort === "precio" ? undefined : sort }} />}
      </section>
    </div>
  );
}
