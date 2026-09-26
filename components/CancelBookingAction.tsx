"use client";

import { useActionState, useState } from "react";
import { cancelBooking } from "@/app/actions/bookings";
import { Modal, SubmitButton, TextareaField } from "@/components/forms";
import { Notice, secondaryButton } from "@/components/ui";
import { cancellationPolicy, hoursUntil } from "@/lib/cancellation";
import { money } from "@/lib/format";

type CancelBookingActionProps = {
  bookingId: number;
  totalPrice: number;
  isRecurrent: boolean;
  bookingDate: string;
  startTime: string;
  unpaid: boolean;
  isVip: boolean;
};

export function CancelBookingAction({ bookingId, totalPrice, isRecurrent, bookingDate, startTime, unpaid, isVip }: CancelBookingActionProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(cancelBooking, undefined);
  const [hours, setHours] = useState(0);

  const policy = cancellationPolicy({ hoursInAdvance: hours, isVip, unpaid });
  const penalty = unpaid ? 0 : (totalPrice * policy.percent) / 100;
  const done = Boolean(state?.success);

  const openDialog = () => {
    setHours(hoursUntil(`${bookingDate}T${startTime}`, Date.now()));
    setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={openDialog} className={`${secondaryButton} px-4 py-1.5 text-xs`}>Cancelar</button>

      <Modal open={open} onClose={() => setOpen(false)} title="Cancelar reserva" description={hours > 0 ? `Faltan ${hours} h para tu reserva.` : "Tu reserva empieza en menos de una hora."}>
        {done ? (
          <div className="flex flex-col gap-4">
            <Notice tone="success">{state?.success}</Notice>
            <button type="button" onClick={() => setOpen(false)} className={secondaryButton}>Cerrar</button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="bookingId" value={bookingId} />

            <Notice tone={policy.percent === 0 ? "success" : "warning"}>{policy.reason}</Notice>

            {!unpaid && (
              <dl className="flex flex-col gap-2 rounded-2xl bg-secondary/60 p-4 text-sm">
                <div className="flex justify-between"><dt>Total pagado</dt><dd className="font-bold">{money(totalPrice)}</dd></div>
                <div className="flex justify-between"><dt>Penalización ({policy.percent}%)</dt><dd className="font-bold text-destructive">− {money(penalty)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2"><dt>Reembolso estimado</dt><dd className="font-bold">{money(totalPrice - penalty)}</dd></div>
              </dl>
            )}

            <TextareaField id={`reason-${bookingId}`} name="reason" label="Motivo" optional rows={2} maxLength={200} placeholder="Cuéntanos por qué cancelas" />

            {isRecurrent && (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="cancelAllRecurrent" className="size-4 accent-primary" />
                Cancelar toda la serie recurrente
              </label>
            )}

            {state?.error && <Notice tone="error">{state.error}</Notice>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className={`${secondaryButton} flex-1`}>Conservar reserva</button>
              <SubmitButton variant="danger" pendingText="Cancelando…" className="flex-1">Confirmar cancelación</SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
