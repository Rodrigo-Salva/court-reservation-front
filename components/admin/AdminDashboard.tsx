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
  UserResponseDTO,
} from "@/lib/definitions";
import type { DayOccupancy } from "@/lib/adminStats";

const TABS = ["Resumen", "Canchas", "Usuarios", "Paquetes"] as const;
type Tab = (typeof TABS)[number];

export function AdminDashboard({
  currentUserId,
  courts,
  packages,
  users,
  stats,
}: {
  currentUserId: number;
  courts: CourtResponseDTO[];
  packages: PackageResponseDTO[];
  users: UserResponseDTO[];
  stats: {
    occupancyToday: number;
    revenueThisMonth: number;
    todayBookingsCount: number;
    todayPending: number;
    activeUsers: number;
    last7Days: DayOccupancy[];
    recentActivity: BookingResponseDTO[];
  };
}) {
  const [tab, setTab] = useState<Tab>("Resumen");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 border-b border-border">
        {TABS.map((t) => (
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
      {tab === "Canchas" && <CourtManager courts={courts} />}
      {tab === "Usuarios" && (
        <UserManager users={users} currentUserId={currentUserId} />
      )}
      {tab === "Paquetes" && <PackageManager packages={packages} />}
    </div>
  );
}
