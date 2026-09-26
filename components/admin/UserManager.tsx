"use client";

import { Avatar, StatusPill, inputClass, primaryButton } from "@/components/ui";
import { ConfirmButton } from "@/components/forms";
import { AdminCard, rowButton, tdClass, thClass } from "@/components/admin/shared";
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
    <AdminCard title="Usuarios" subtitle={`${usersPage.totalElements} usuarios en total`}>
      <form method="get" action="/administracion" className="flex flex-wrap gap-2 px-5 pb-5">
        <input type="hidden" name="tab" value="Usuarios" />
        <input name="uq" defaultValue={filters.q} aria-label="Buscar usuarios" placeholder="Buscar por nombre, correo o teléfono" className={`${inputClass} min-w-0 flex-1`} />
        <select name="ustatus" defaultValue={filters.status} aria-label="Estado" className={`${inputClass} w-auto`}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <button className={primaryButton}>Buscar</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/40">
              <th className={thClass}>Usuario</th>
              <th className={thClass}>Correo</th>
              <th className={thClass}>Membresía</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-secondary/40">
                <td className={tdClass}>
                  <span className="flex items-center gap-3 font-semibold"><Avatar name={user.name} />{user.name}</span>
                </td>
                <td className={`${tdClass} text-muted-foreground`}>{user.email}</td>
                <td className={`${tdClass} text-muted-foreground`}>{membershipLabel(user.membershipType)}</td>
                <td className={tdClass}><StatusPill tone={user.active ? "success" : "neutral"}>{user.active ? "Activo" : "Inactivo"}</StatusPill></td>
                <td className={tdClass}>
                  {user.id !== currentUserId && (
                    <div className="flex justify-end">
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="active" value={String(user.active)} />
                        <ConfirmButton
                          title={user.active ? "Desactivar usuario" : "Activar usuario"}
                          message={user.active ? `${user.name} no podrá iniciar sesión ni reservar.` : `${user.name} podrá volver a iniciar sesión y reservar.`}
                          confirmLabel={user.active ? "Sí, desactivar" : "Sí, activar"}
                          tone={user.active ? "danger" : "primary"}
                          className={rowButton}
                        >
                          <Settings2 size={13} />{user.active ? "Desactivar" : "Activar"}
                        </ConfirmButton>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">No hay usuarios para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Pagination basePath="/administracion" pageParam="upage" page={usersPage.page} totalPages={usersPage.totalPages} totalElements={usersPage.totalElements} params={{ tab: "Usuarios", uq: filters.q, ustatus: filters.status }} />
      </div>
    </AdminCard>
  );
}
