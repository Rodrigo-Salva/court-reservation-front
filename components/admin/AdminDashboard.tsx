"use client";

import { useState } from "react";
import { SummaryTab } from "@/components/admin/SummaryTab";
import { CourtManager } from "@/components/admin/CourtManager";
import { UserManager } from "@/components/admin/UserManager";
import { PackageManager } from "@/components/admin/PackageManager";
import type {
  BookingResponseDTO,
  CourtResponseDTO,
  PackageResponseDTO,
  PageResponse,
  UserResponseDTO,
  VenueResponseDTO,
} from "@/lib/definitions";
import type { DayOccupancy } from "@/lib/adminStats";

const ALL_TABS = ["Resumen", "Canchas", "Usuarios", "Paquetes"] as const;
const STAFF_TABS = ["Resumen", "Canchas"] as const;
type Tab = (typeof ALL_TABS)[number];

export function AdminDashboard({
  isAdmin,
  initialTab,
  currentUserId,
  courts,
  venues,
  packages,
  usersPage,
  userFilters,
  stats,
}: {
  isAdmin: boolean;
  initialTab?: string;
  currentUserId: number;
  courts: CourtResponseDTO[];
  venues: VenueResponseDTO[];
  packages: PackageResponseDTO[];
  usersPage: PageResponse<UserResponseDTO> | null;
  userFilters: { q: string; status: string };
  stats: {
    occupancyToday: number;
    revenueThisMonth: number;
    todayBookingsCount: number;
    todayPending: number;
    activeUsers: number | null;
    last7Days: DayOccupancy[];
    recentActivity: BookingResponseDTO[];
  };
}) {
  const tabs: readonly Tab[] = isAdmin ? ALL_TABS : STAFF_TABS;
  const [tab, setTab] = useState<Tab>(tabs.find((t) => t === initialTab) ?? "Resumen");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-1 pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-[#22c55e] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Resumen" && <SummaryTab {...stats} />}
      {tab === "Canchas" && <CourtManager courts={courts} venues={venues} />}
      {isAdmin && tab === "Usuarios" && usersPage && (
        <UserManager usersPage={usersPage} currentUserId={currentUserId} filters={userFilters} />
      )}
      {isAdmin && tab === "Paquetes" && <PackageManager packages={packages} />}
    </div>
  );
}
