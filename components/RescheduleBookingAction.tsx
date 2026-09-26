"use client";

import { useActionState, useState } from "react";
import { rescheduleBooking } from "@/app/actions/bookings";
import { Modal, TextField, ConfirmButton } from "@/components/forms";
import { Notice, secondaryButton } from "@/components/ui";

export function RescheduleBookingAction({ bookingId, date, startTime, endTime }: { bookingId: number; date: string; startTime: string; endTime: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(rescheduleBooking, undefined);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${secondaryButton} px-3 py-1.5 text-xs`}>Reprogramar</button>

      <Modal open={open} onClose={() => setOpen(false)} title="Reprogramar reserva" description="El nuevo horario debe estar disponible y respetar las reglas de la cancha.">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <TextField id={`date-${bookingId}`} name="bookingDate" label="Nueva fecha" type="date" defaultValue={date} />
          <div className="grid grid-cols-2 gap-3">
            <TextField id={`start-${bookingId}`} name="startTime" label="Inicio" type="time" defaultValue={startTime.slice(0, 5)} />
            <TextField id={`end-${bookingId}`} name="endTime" label="Fin" type="time" defaultValue={endTime.slice(0, 5)} />
          </div>
          {state?.error && <Notice tone="error">{state.error}</Notice>}
          {state?.success && <Notice tone="success">{state.success}</Notice>}
          <ConfirmButton message="Tu reserva se moverá al nuevo horario si está disponible." confirmLabel="Sí, reprogramar" pendingText="Guardando…">Confirmar cambio</ConfirmButton>
        </form>
      </Modal>
    </>
  );
}
