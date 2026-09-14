import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { computeAdminStats } from "@/lib/adminStats";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type {
  BookingResponseDTO,
  CourtResponseDTO,
  PackageResponseDTO,
  UserResponseDTO,
} from "@/lib/definitions";

export default async function AdministracionPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    redirect("/explorar");
  }

  let courts: CourtResponseDTO[] = [];
  let packages: PackageResponseDTO[] = [];
  let users: UserResponseDTO[] = [];
  let bookings: BookingResponseDTO[] = [];
  let error: string | null = null;

  try {
    [courts, packages, users, bookings] = await Promise.all([
      apiFetch<CourtResponseDTO[]>("/api/courts/all", { token: session.token }),
      apiFetch<PackageResponseDTO[]>("/api/packages/all", { token: session.token }),
      apiFetch<UserResponseDTO[]>("/api/users/all", { token: session.token }),
      apiFetch<BookingResponseDTO[]>("/api/bookings", { token: session.token }),
    ]);
  } catch (err) {
    error =
      err instanceof ApiError ? err.message : "No se pudo cargar la administración.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Administración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista general del negocio, canchas, usuarios y paquetes.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && (
        <AdminDashboard
          currentUserId={session.userId}
          courts={courts}
          packages={packages}
          users={users}
          stats={computeAdminStats({ bookings, courts, users })}
        />
      )}
    </div>
  );
}
