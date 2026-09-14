import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { purchasePackage } from "@/app/actions/packages";
import type { PackageResponseDTO, UserPackageResponseDTO } from "@/lib/definitions";

export default async function PaquetesPage() {
  const session = await getSession();

  let packages: PackageResponseDTO[] = [];
  let packagesError: string | null = null;
  try {
    packages = await apiFetch<PackageResponseDTO[]>("/api/packages", {
      token: session?.token,
    });
  } catch (err) {
    packagesError =
      err instanceof ApiError ? err.message : "No se pudieron cargar los paquetes.";
  }

  let myPackages: UserPackageResponseDTO[] = [];
  let myPackagesError: string | null = null;
  try {
    myPackages = await apiFetch<UserPackageResponseDTO[]>(
      `/api/user-packages/user/${session!.userId}/active`,
      { token: session!.token }
    );
  } catch (err) {
    myPackagesError =
      err instanceof ApiError ? err.message : "No se pudieron cargar tus paquetes.";
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Mis paquetes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Horas prepagadas con descuento para tus reservas.
      </p>

      {myPackagesError && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {myPackagesError}
        </p>
      )}

      {!myPackagesError && myPackages.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Todavía no tienes paquetes activos.
        </p>
      )}

      {myPackages.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {myPackages.map((userPackage) => (
            <li
              key={userPackage.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {userPackage.packageName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userPackage.remainingHours} de {userPackage.initialHours}{" "}
                  horas disponibles
                </p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                Vence en {userPackage.daysUntilExpiration} días
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-xl font-bold text-foreground">
        Paquetes disponibles
      </h2>

      {packagesError && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {packagesError}
        </p>
      )}

      {!packagesError && packages.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No hay paquetes disponibles por el momento.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <span className="inline-block w-fit rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              {Math.round(pkg.discountPercentage * 100)}% de descuento
            </span>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              {pkg.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pkg.hoursQuantity} horas · válido {pkg.validityDays} días
            </p>
            <p className="mt-3 text-lg font-bold text-foreground">
              S/ {pkg.price}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                · S/ {pkg.pricePerHour}/hora
              </span>
            </p>
            <form action={purchasePackage} className="mt-4">
              <input type="hidden" name="packageId" value={pkg.id} />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Comprar
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
