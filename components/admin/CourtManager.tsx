"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, X, Settings2 } from "lucide-react";
import { saveCourt, toggleCourtActive } from "@/app/actions/admin";
import { SPORT_TYPES, type CourtResponseDTO, type VenueResponseDTO } from "@/lib/definitions";
import { sportLabel } from "@/lib/sport";
import { SelectField, TextField, TextareaField, ConfirmButton } from "@/components/forms";
import { Notice, StatusPill, primaryButton, secondaryButton } from "@/components/ui";
import { AdminCard, Pager, rowButton, tdClass, thClass, usePaged } from "@/components/admin/shared";

export function CourtManager({ courts, venues }: { courts: CourtResponseDTO[]; venues: VenueResponseDTO[] }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const paged = usePaged(courts, 8);

  return (
    <AdminCard
      title="Canchas"
      subtitle={`${courts.length} canchas registradas`}
      action={
        <button type="button" onClick={() => setEditingId(editingId === "new" ? null : "new")} className={primaryButton}>
          <Plus size={16} />Nueva cancha
        </button>
      }
    >
      {editingId === "new" && (
        <div className="px-5 pb-5">
          <CourtForm venues={venues} onDone={() => setEditingId(null)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/40">
              <th className={thClass}>Cancha</th>
              <th className={thClass}>Sede</th>
              <th className={thClass}>Deporte</th>
              <th className={thClass}>Precio / hora</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.items.map((court) =>
              editingId === court.id ? (
                <tr key={court.id}>
                  <td colSpan={6} className="px-5 py-4">
                    <CourtForm court={court} venues={venues} onDone={() => setEditingId(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={court.id} className="transition hover:bg-secondary/40">
                  <td className={`${tdClass} font-semibold`}>{court.name}</td>
                  <td className={`${tdClass} text-muted-foreground`}>{court.venueName ?? "Sin sede"}</td>
                  <td className={`${tdClass} text-muted-foreground`}>{sportLabel(court.sportType)}</td>
                  <td className={`${tdClass} font-semibold`}>S/ {court.basePricePerHour}</td>
                  <td className={tdClass}><StatusPill tone={court.active ? "success" : "neutral"}>{court.active ? "Activa" : "Inactiva"}</StatusPill></td>
                  <td className={tdClass}>
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(court.id)} className={rowButton}><Pencil size={13} />Editar</button>
                      <form action={toggleCourtActive}>
                        <input type="hidden" name="id" value={court.id} />
                        <input type="hidden" name="active" value={String(court.active)} />
                        <ConfirmButton
                          title={court.active ? "Desactivar cancha" : "Activar cancha"}
                          message={court.active ? `"${court.name}" dejará de aparecer para reservas.` : `"${court.name}" volverá a estar disponible para reservas.`}
                          confirmLabel={court.active ? "Sí, desactivar" : "Sí, activar"}
                          tone={court.active ? "danger" : "primary"}
                          className={rowButton}
                        >
                          <Settings2 size={13} />{court.active ? "Desactivar" : "Activar"}
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

function CourtForm({
  court,
  venues,
  onDone,
}: {
  court?: CourtResponseDTO;
  venues: VenueResponseDTO[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(saveCourt, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  const key = court?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-primary/40 bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-bold">{court ? "Editar cancha" : "Nueva cancha"}</p>
        <button type="button" onClick={onDone} aria-label="Cerrar" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
          <X size={16} />
        </button>
      </div>

      {court && <input type="hidden" name="id" value={court.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id={`court-name-${key}`} name="name" label="Nombre" defaultValue={court?.name} error={state?.fieldErrors?.name} />
        <SelectField id={`court-sport-${key}`} name="sportType" label="Deporte" defaultValue={court?.sportType ?? SPORT_TYPES[0].value}>
          {SPORT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectField>
        {venues.length > 0 && (
          <SelectField id={`court-venue-${key}`} name="venueId" label="Sede" required defaultValue={court?.venueId ?? ""}>
            <option value="" disabled>Selecciona una sede</option>
            {venues.filter((v) => v.active || v.id === court?.venueId).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </SelectField>
        )}
        <TextField id={`court-capacity-${key}`} name="capacity" label="Capacidad" type="number" min={1} defaultValue={court?.capacity} error={state?.fieldErrors?.capacity} hint="Jugadores máximos." />
        <TextField id={`court-price-${key}`} name="basePricePerHour" label="Precio por hora (S/)" type="number" min={0} step="0.01" defaultValue={court?.basePricePerHour} error={state?.fieldErrors?.basePricePerHour} hint="Precio base; se ajusta por horario y membresía." />
        <TextareaField id={`court-desc-${key}`} name="description" label="Descripción" optional rows={2} defaultValue={court?.description} wrapperClassName="sm:col-span-2" />
      </div>

      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <div className="flex gap-3">
        <ConfirmButton message={court ? "Se guardarán los cambios de esta cancha." : "Se creará la nueva cancha."} confirmLabel="Sí, guardar" pendingText="Guardando…">Guardar</ConfirmButton>
        <button type="button" onClick={onDone} className={secondaryButton}>Cancelar</button>
      </div>
    </form>
  );
}
