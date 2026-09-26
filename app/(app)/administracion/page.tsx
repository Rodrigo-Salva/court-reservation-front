import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { computeAdminStats } from "@/lib/adminStats";
import { Notice, PageHeader } from "@/components/ui";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type {
  BookingResponseDTO,
  CourtResponseDTO,
  PackageResponseDTO,
  PageResponse,
  UserResponseDTO,
  VenueResponseDTO,
} from "@/lib/definitions";

type Params = { tab?: string; uq?: string; ustatus?: string; upage?: string };

const USERS_PAGE_SIZE = 10;

export default async function AdministracionPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"].includes(session.role)) {
    redirect("/explorar");
  }
  const params = await searchParams;
  const token = session.token;

  // Usuarios y paquetes son solo del ADMIN global; el admin de sede gestiona únicamente sus canchas.
  const isAdmin = session.role === "ADMIN";
  const canPickVenue = session.role !== "VENUE_ADMIN";

  const usersQuery = new URLSearchParams({ size: String(USERS_PAGE_SIZE), page: String(Math.max(0, Number(params.upage) || 0)) });
  if (params.uq?.trim()) usersQuery.set("q", params.uq.trim());
  if (params.ustatus === "active") usersQuery.set("active", "true");
  if (params.ustatus === "inactive") usersQuery.set("active", "false");

  let courts: CourtResponseDTO[] = [];
  let bookings: BookingResponseDTO[] = [];
  let venues: VenueResponseDTO[] = [];
  let packages: PackageResponseDTO[] = [];
  let usersPage: PageResponse<UserResponseDTO> | null = null;
  let activeUsers: number | null = null;
  let error: string | null = null;

  try {
    const [courtsResult, bookingsResult, venuesResult, packagesResult, usersResult, activeResult] = await Promise.all([
      apiFetch<CourtResponseDTO[]>("/api/courts/all", { token }),
      apiFetch<BookingResponseDTO[]>("/api/bookings", { token }),
      canPickVenue ? apiFetch<VenueResponseDTO[]>("/api/venues/all", { token }) : Promise.resolve([] as VenueResponseDTO[]),
      isAdmin ? apiFetch<PackageResponseDTO[]>("/api/packages/all", { token }) : Promise.resolve([] as PackageResponseDTO[]),
      isAdmin ? apiFetch<PageResponse<UserResponseDTO>>(`/api/users/page?${usersQuery}`, { token }) : Promise.resolve(null),
      isAdmin ? apiFetch<PageResponse<UserResponseDTO>>("/api/users/page?active=true&size=1", { token }) : Promise.resolve(null),
    ]);
    courts = courtsResult;
    bookings = bookingsResult;
    venues = venuesResult;
    packages = packagesResult;
    usersPage = usersResult;
    activeUsers = activeResult ? activeResult.totalElements : null;
  } catch (err) {
    error = err instanceof ApiError ? err.message : "No se pudo cargar la administración.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Gestión"
        title="Administración"
        description={isAdmin ? "Vista general del negocio, canchas, usuarios y paquetes." : "Vista general y canchas de tu sede."}
      />

      {error && <Notice tone="error">{error}</Notice>}

      {!error && (
        <AdminDashboard
          isAdmin={isAdmin}
          initialTab={params.tab}
          currentUserId={session.userId}
          courts={courts}
          venues={venues}
          packages={packages}
          usersPage={usersPage}
          userFilters={{ q: params.uq ?? "", status: params.ustatus ?? "" }}
          stats={computeAdminStats({ bookings, courts, activeUsers })}
        />
      )}
    </div>
  );
}
