"use client";

import { useState } from "react";
import { X, Percent } from "lucide-react";
import { cancelBooking } from "@/app/actions/bookings";

type CancelBookingActionProps = {
  bookingId: number;
  totalPrice: number;
  isRecurrent: boolean;
};

export function CancelBookingAction({ bookingId, totalPrice, isRecurrent }: CancelBookingActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Simplified penalty logic for the UI (50% as in screenshot)
  const penalty = totalPrice * 0.5;
  const refund = totalPrice - penalty;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-border bg-card px-4 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
      >
        Cancelar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="mb-4 flex w-fit items-center justify-center rounded-full bg-[#fef3c7] p-3 text-[#d97706] mx-auto">
              <Percent size={24} strokeWidth={3} />
            </div>

            <h2 className="text-xl font-bold text-foreground text-left">Cancelar reserva</h2>
            <p className="mt-2 text-sm text-muted-foreground text-left">
              Faltan 10 horas para tu reserva. Se aplicará la política de cancelación vigente.
            </p>

            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-secondary/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Total pagado</span>
                <span className="font-bold text-foreground">S/ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="h-px w-full bg-border"></div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Penalización (50%)</span>
                <span className="font-bold text-[#ef4444]">- S/ {penalty.toFixed(2)}</span>
              </div>
              <div className="h-px w-full bg-border"></div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Reembolso</span>
                <span className="font-bold text-foreground">S/ {refund.toFixed(2)}</span>
              </div>
            </div>

            {isRecurrent && (
              <label className="mt-6 flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input 
                  type="checkbox" 
                  name="cancelRecurrent"
                  className="w-4 h-4 rounded border-[#22c55e] text-[#22c55e] focus:ring-[#22c55e] accent-[#22c55e]" 
                />
                Cancelar toda la serie recurrente
              </label>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-border bg-card py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors"
              >
                Conservar reserva
              </button>
              
              <form action={cancelBooking} className="flex-1">
                <input type="hidden" name="bookingId" value={bookingId} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#ef4444] py-2.5 text-sm font-bold text-white hover:bg-[#ef4444]/90 transition-colors"
                >
                  Confirmar cancelación
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
