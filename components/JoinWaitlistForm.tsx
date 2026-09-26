"use client";

import { ConfirmButton } from "@/components/forms";
import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { joinWaitingList } from "@/app/actions/waitlist";
import { Notice, cardClass, inputClass, primaryButton } from "@/components/ui";
import type { CourtResponseDTO } from "@/lib/definitions";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function JoinWaitlistForm({ courts }: { courts: CourtResponseDTO[] }) {
  const [state, formAction] = useActionState(joinWaitingList, undefined);

  return (
    <form action={formAction} className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-emerald-800"><BellRing size={19} /></span>
        <div>
          <h2 className="font-display text-lg font-bold">Unirme a una lista de espera</h2>
          <p className="text-xs text-muted-foreground">Elige el horario que quieres; te avisamos si se libera.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold sm:col-span-2 lg:col-span-1">Cancha
          <select id="courtId" name="courtId" required className={`${inputClass} mt-1.5 font-normal`}>
            {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Fecha deseada
          <input id="desiredDate" name="desiredDate" type="date" required min={todayISO()} defaultValue={todayISO()} className={`${inputClass} mt-1.5 font-normal`} />
        </label>
        <label className="text-sm font-semibold">Hora de inicio
          <input id="desiredStartTime" name="desiredStartTime" type="time" required className={`${inputClass} mt-1.5 font-normal`} />
        </label>
        <label className="text-sm font-semibold">Hora de fin
          <input id="desiredEndTime" name="desiredEndTime" type="time" required className={`${inputClass} mt-1.5 font-normal`} />
        </label>
      </div>

      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.success && <Notice tone="success">{state.success}</Notice>}

      <div>
        <ConfirmButton message="Te añadiremos a la lista de espera y te avisaremos si se libera el horario." confirmLabel="Sí, unirme" pendingText="Uniéndote…" disabled={courts.length === 0} className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-60`}>Unirme a la lista de espera</ConfirmButton>
      </div>
    </form>
  );
}
