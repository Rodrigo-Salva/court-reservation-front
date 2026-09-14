"use client";

import { useActionState } from "react";
import { joinWaitingList } from "@/app/actions/waitlist";
import type { CourtResponseDTO } from "@/lib/definitions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function JoinWaitlistForm({ courts }: { courts: CourtResponseDTO[] }) {
  const [state, formAction, pending] = useActionState(joinWaitingList, undefined);

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="courtId" className="text-sm font-medium text-foreground">
            Cancha
          </label>
          <select
            id="courtId"
            name="courtId"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="desiredDate" className="text-sm font-medium text-foreground">
            Fecha deseada
          </label>
          <input
            id="desiredDate"
            name="desiredDate"
            type="date"
            required
            min={todayISO()}
            defaultValue={todayISO()}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="desiredStartTime"
            className="text-sm font-medium text-foreground"
          >
            Hora de inicio
          </label>
          <input
            id="desiredStartTime"
            name="desiredStartTime"
            type="time"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="desiredEndTime" className="text-sm font-medium text-foreground">
            Hora de fin
          </label>
          <input
            id="desiredEndTime"
            name="desiredEndTime"
            type="time"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || courts.length === 0}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Uniéndote..." : "Unirme a la lista de espera"}
      </button>
    </form>
  );
}
