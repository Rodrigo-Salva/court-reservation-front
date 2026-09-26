"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, X, Settings2 } from "lucide-react";
import { savePackage, togglePackageActive } from "@/app/actions/admin";
import type { PackageResponseDTO } from "@/lib/definitions";
import { TextField, ConfirmButton } from "@/components/forms";
import { Notice, StatusPill, primaryButton, secondaryButton } from "@/components/ui";
import { AdminCard, Pager, rowButton, tdClass, thClass, usePaged } from "@/components/admin/shared";

export function PackageManager({ packages }: { packages: PackageResponseDTO[] }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const paged = usePaged(packages, 8);

  return (
    <AdminCard
      title="Paquetes de horas"
      subtitle={`${packages.length} paquetes registrados`}
      action={
        <button type="button" onClick={() => setEditingId(editingId === "new" ? null : "new")} className={primaryButton}>
          <Plus size={16} />Nuevo paquete
        </button>
      }
    >
      {editingId === "new" && (
        <div className="px-5 pb-5">
          <PackageForm onDone={() => setEditingId(null)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/40">
              <th className={thClass}>Paquete</th>
              <th className={thClass}>Horas</th>
              <th className={thClass}>Descuento</th>
              <th className={thClass}>Precio</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.items.map((pkg) =>
              editingId === pkg.id ? (
                <tr key={pkg.id}>
                  <td colSpan={6} className="px-5 py-4">
                    <PackageForm pkg={pkg} onDone={() => setEditingId(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={pkg.id} className="transition hover:bg-secondary/40">
                  <td className={`${tdClass} font-semibold`}>{pkg.name}</td>
                  <td className={`${tdClass} text-muted-foreground`}>{pkg.hoursQuantity} h</td>
                  <td className={`${tdClass} text-muted-foreground`}>{Math.round(pkg.discountPercentage * 100)}%</td>
                  <td className={`${tdClass} font-semibold`}>S/ {pkg.price}</td>
                  <td className={tdClass}><StatusPill tone={pkg.active ? "success" : "neutral"}>{pkg.active ? "Activo" : "Inactivo"}</StatusPill></td>
                  <td className={tdClass}>
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(pkg.id)} className={rowButton}><Pencil size={13} />Editar</button>
                      <form action={togglePackageActive}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <input type="hidden" name="active" value={String(pkg.active)} />
                        <ConfirmButton
                          title={pkg.active ? "Desactivar paquete" : "Activar paquete"}
                          message={pkg.active ? `"${pkg.name}" dejará de estar a la venta.` : `"${pkg.name}" volverá a estar a la venta.`}
                          confirmLabel={pkg.active ? "Sí, desactivar" : "Sí, activar"}
                          tone={pkg.active ? "danger" : "primary"}
                          className={rowButton}
                        >
                          <Settings2 size={13} />{pkg.active ? "Desactivar" : "Activar"}
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <Pager page={paged.page} totalPages={paged.totalPages} total={paged.total} onPage={paged.setPage} />
    </AdminCard>
  );
}

function PackageForm({
  pkg,
  onDone,
}: {
  pkg?: PackageResponseDTO;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(savePackage, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  const key = pkg?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-primary/40 bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-bold">{pkg ? "Editar paquete" : "Nuevo paquete"}</p>
        <button type="button" onClick={onDone} aria-label="Cerrar" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
          <X size={16} />
        </button>
      </div>

      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id={`pkg-name-${key}`} name="name" label="Nombre" defaultValue={pkg?.name} error={state?.fieldErrors?.name} wrapperClassName="sm:col-span-2" />
        <TextField id={`pkg-hours-${key}`} name="hoursQuantity" label="Horas incluidas" type="number" min={1} defaultValue={pkg?.hoursQuantity} error={state?.fieldErrors?.hoursQuantity} />
        <TextField id={`pkg-price-${key}`} name="price" label="Precio (S/)" type="number" min={0} step="0.01" defaultValue={pkg?.price} error={state?.fieldErrors?.price} />
        <TextField id={`pkg-discount-${key}`} name="discountPercentage" label="Descuento (%)" type="number" min={0} max={100} step="1" defaultValue={pkg ? Math.round(pkg.discountPercentage * 100) : undefined} error={state?.fieldErrors?.discountPercentage} />
        <TextField id={`pkg-validity-${key}`} name="validityDays" label="Vigencia (días)" type="number" min={1} defaultValue={pkg?.validityDays} error={state?.fieldErrors?.validityDays} />
      </div>

      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <div className="flex gap-3">
        <ConfirmButton message={pkg ? "Se guardarán los cambios de este paquete." : "Se creará el nuevo paquete."} confirmLabel="Sí, guardar" pendingText="Guardando…">Guardar</ConfirmButton>
        <button type="button" onClick={onDone} className={secondaryButton}>Cancelar</button>
      </div>
    </form>
  );
}
