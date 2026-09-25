"use client";

import { Settings2 } from "lucide-react";
import { toggleUserActive } from "@/app/actions/admin";
import { Pagination } from "@/components/Pagination";
import { MEMBERSHIP_TYPES, type PageResponse, type UserResponseDTO } from "@/lib/definitions";

const membershipLabel = (value: string) =>
  MEMBERSHIP_TYPES.find((m) => m.value === value)?.label ?? value;

export function UserManager({
  usersPage,
  currentUserId,
  filters,
}: {
  usersPage: PageResponse<UserResponseDTO>;
  currentUserId: number;
  filters: { q: string; status: string };
}) {
  const users = usersPage.content;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h2 className="font-display text-lg font-bold text-foreground">Usuarios</h2>
      </div>

      <form method="get" action="/administracion" className="flex flex-wrap gap-2 px-5 pb-4">
        <input type="hidden" name="tab" value="Usuarios" />
        <input
          name="uq"
          defaultValue={filters.q}
          placeholder="Buscar por nombre, correo o teléfono"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <select name="ustatus" defaultValue={filters.status} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <button className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-bold text-white hover:opacity-90">Buscar</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3">Nombre</th>
            <th className="px-5 py-3">Correo</th>
            <th className="px-5 py-3">Membresía</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-secondary/40">
              <td className="px-5 py-3 font-medium text-foreground">{user.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {membershipLabel(user.membershipType)}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    user.active
                      ? "bg-[#dcfce7] text-[#166534]"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {user.active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-5 py-3">
                {user.id !== currentUserId && (
                  <div className="flex items-center justify-end">
                    <form action={toggleUserActive}>
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="active" value={String(user.active)} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title={user.active ? "Desactivar" : "Activar"}
                      >
                        <Settings2 size={14} />
                      </button>
                    </form>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground">No hay usuarios para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-border p-4">
        <Pagination
          basePath="/administracion"
          pageParam="upage"
          page={usersPage.page}
          totalPages={usersPage.totalPages}
          totalElements={usersPage.totalElements}
          params={{ tab: "Usuarios", uq: filters.q, ustatus: filters.status }}
        />
      </div>
    </div>
  );
}
