"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, X, Settings2 } from "lucide-react";
import { saveCourt, toggleCourtActive } from "@/app/actions/admin";
import { SPORT_TYPES, type CourtResponseDTO } from "@/lib/definitions";
import { sportLabel } from "@/lib/sport";

export function CourtManager({ courts }: { courts: CourtResponseDTO[] }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h2 className="font-display text-lg font-bold text-foreground">Canchas</h2>
        <button
          type="button"
          onClick={() => setEditingId(editingId === "new" ? null : "new")}
          className="flex items-center gap-1 rounded-lg bg-[#22c55e] px-3 py-1.5 text-sm font-bold text-white hover:opacity-90"
        >
          <Plus size={16} />
          Crear nuevo
        </button>
      </div>

      {editingId === "new" && (
        <div className="px-5 pb-5">
          <CourtForm onDone={() => setEditingId(null)} />
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3">Nombre</th>
            <th className="px-5 py-3">Tipo</th>
            <th className="px-5 py-3">Precio</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courts.map((court) =>
            editingId === court.id ? (
              <tr key={court.id}>
                <td colSpan={5} className="px-5 py-4">
                  <CourtForm court={court} onDone={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={court.id} className="hover:bg-secondary/40">
                <td className="px-5 py-3 font-medium text-foreground">{court.name}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {sportLabel(court.sportType)}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  S/ {court.basePricePerHour}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      court.active
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {court.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(court.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <form action={toggleCourtActive}>
                      <input type="hidden" name="id" value={court.id} />
                      <input type="hidden" name="active" value={String(court.active)} />
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title={court.active ? "Desactivar" : "Activar"}
                      >
                        <Settings2 size={14} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function CourtForm({
  court,
  onDone,
}: {
  court?: CourtResponseDTO;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveCourt, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-[#22c55e] bg-background p-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-foreground text-sm">
          {court ? "Editar cancha" : "Nueva cancha"}
        </p>
        <button type="button" onClick={onDone} className="text-muted-foreground">
          <X size={16} />
        </button>
      </div>

      {court && <input type="hidden" name="id" value={court.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre" name="name" defaultValue={court?.name} error={state?.fieldErrors?.name} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-foreground">Deporte</label>
          <select
            name="sportType"
            defaultValue={court?.sportType ?? SPORT_TYPES[0].value}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {SPORT_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Capacidad"
          name="capacity"
          type="number"
          defaultValue={court?.capacity}
          error={state?.fieldErrors?.capacity}
        />
        <Field
          label="Precio/hora (S/)"
          name="basePricePerHour"
          type="number"
          step="0.01"
          defaultValue={court?.basePricePerHour}
          error={state?.fieldErrors?.basePricePerHour}
        />
        <div className="sm:col-span-2">
          <Field label="Descripción" name="description" defaultValue={court?.description} />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        required={name !== "description"}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
