"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Package, Repeat } from "lucide-react";
import { createBooking } from "@/app/actions/bookings";
import { sportLabel } from "@/lib/sport";
import type {
  CourtResponseDTO,
  TimeSlotDTO,
  UserPackageResponseDTO,
} from "@/lib/definitions";

const MAX_SLOTS = 4;

type Slot = TimeSlotDTO & { status: "free" | "occupied" };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatLongDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function BookingWizard({
  court,
  date,
  availableSlots,
  occupiedSlots,
  bestPackage,
  membershipDiscount,
  maxDaysAdvance,
}: {
  court: CourtResponseDTO;
  date: string;
  availableSlots: TimeSlotDTO[];
  occupiedSlots: TimeSlotDTO[];
  bestPackage: UserPackageResponseDTO | null;
  membershipDiscount: number;
  maxDaysAdvance: number;
}) {
  const slots: Slot[] = useMemo(() => {
    const merged = [
      ...availableSlots.map((s) => ({ ...s, status: "free" as const })),
      ...occupiedSlots.map((s) => ({ ...s, status: "occupied" as const })),
    ];
    return merged.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availableSlots, occupiedSlots]);

  const [range, setRange] = useState<[number, number] | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [usesPackage, setUsesPackage] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [numberOfWeeks, setNumberOfWeeks] = useState(4);
  const [state, formAction, pending] = useActionState(createBooking, undefined);

  function handleSlotClick(index: number) {
    if (slots[index].status !== "free") return;

    if (!range) {
      setRange([index, index]);
      return;
    }

    const [start, end] = range;

    if (index === end + 1 && end - start + 1 < MAX_SLOTS && slots[index].status === "free") {
      setRange([start, index]);
      return;
    }
    if (index === start - 1 && end - start + 1 < MAX_SLOTS && slots[index].status === "free") {
      setRange([index, end]);
      return;
    }

    setRange([index, index]);
  }

  const selectedSlots = range ? slots.slice(range[0], range[1] + 1) : [];
  const hours = selectedSlots.length;
  const startTime = selectedSlots[0]?.startTime;
  const endTime = selectedSlots[selectedSlots.length - 1]?.endTime;
  const subtotal = round2(
    selectedSlots.reduce((sum, s) => sum + (s.estimatedPrice ?? 0), 0)
  );
  const basePrice = round2(court.basePricePerHour * hours);
  const surcharge = round2(subtotal - basePrice);
  const membershipDiscountAmount = round2(subtotal * membershipDiscount);
  const recurrentDiscountAmount = isRecurrent ? round2(subtotal * 0.05) : 0;
  const total = usesPackage
    ? 0
    : round2(subtotal - membershipDiscountAmount - recurrentDiscountAmount);

  const canUsePackage =
    bestPackage != null && bestPackage.remainingHours >= hours && !bestPackage.isExpired;

  if (step === "confirm" && range) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-fit"
          >
            <ChevronLeft size={16} />
            Cambiar horario
          </button>

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Último paso
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Revisa y confirma
          </h2>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#22c55e] text-white">
              〽
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground uppercase mb-1">
                {sportLabel(court.sportType)}
              </span>
              <p className="font-bold text-foreground">{court.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatLongDate(date)} · {startTime} — {endTime}
              </p>
            </div>
          </div>

          {bestPackage && (
            <label
              className={`flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm ${
                canUsePackage ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent p-2 text-accent-foreground">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Usar paquete de horas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Te quedan {bestPackage.remainingHours}h · vence en{" "}
                    {bestPackage.daysUntilExpiration} días
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={usesPackage}
                disabled={!canUsePackage}
                onChange={(e) => setUsesPackage(e.target.checked)}
                className="h-5 w-9 accent-[#22c55e]"
              />
            </label>
          )}

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2 text-accent-foreground">
                <Repeat size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Reserva recurrente
                </p>
                <p className="text-xs text-muted-foreground">
                  Repite este horario cada semana
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurrent}
              onChange={(e) => setIsRecurrent(e.target.checked)}
              className="h-5 w-9 accent-[#22c55e]"
            />
          </div>

          {isRecurrent && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <label htmlFor="numberOfWeeks" className="text-sm font-medium text-foreground">
                Repetir por
              </label>
              <input
                id="numberOfWeeks"
                type="number"
                min={2}
                max={12}
                value={numberOfWeeks}
                onChange={(e) => setNumberOfWeeks(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
              />
              <span className="text-sm text-muted-foreground">semanas</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>✓ Anticipación mínima de 2h</span>
            <span>✓ Duración entre 1 y 4h</span>
            <span>✓ Dentro de tus {maxDaysAdvance} días de anticipación</span>
          </p>
        </div>

        <div className="h-fit rounded-2xl border border-[#22c55e] bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Resumen de pago
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">
            Desglose
          </h3>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Precio base · {hours}h
              </span>
              <span className="font-medium text-foreground">
                S/ {basePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {surcharge >= 0 ? "Recargo horario" : "Descuento horario valle"}
              </span>
              <span className="font-medium text-foreground">
                {surcharge >= 0 ? "+" : ""}S/ {surcharge.toFixed(2)}
              </span>
            </div>
            {membershipDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Descuento membresía
                </span>
                <span className="font-medium text-[#22c55e]">
                  - S/ {membershipDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {isRecurrent && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Descuento recurrente
                </span>
                <span className="font-medium text-[#22c55e]">
                  - S/ {recurrentDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 h-px bg-border" />

          <div className="mt-4 flex justify-between items-center">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              S/ {total.toFixed(2)}
            </span>
          </div>
          {usesPackage && (
            <p className="mt-1 text-xs text-muted-foreground">
              Se descontarán {hours}h de tu paquete.
            </p>
          )}

          {state?.error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <form action={formAction} className="mt-4">
            <input type="hidden" name="courtId" value={court.id} />
            <input type="hidden" name="bookingDate" value={date} />
            <input type="hidden" name="startTime" value={startTime} />
            <input type="hidden" name="endTime" value={endTime} />
            <input type="hidden" name="usesPackage" value={String(usesPackage)} />
            {usesPackage && bestPackage && (
              <input type="hidden" name="userPackageId" value={bestPackage.id} />
            )}
            <input type="hidden" name="isRecurrent" value={String(isRecurrent)} />
            {isRecurrent && (
              <input type="hidden" name="numberOfWeeks" value={numberOfWeeks} />
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#22c55e] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Confirmando..." : "Confirmar reserva"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">
          Elige fecha y hora
        </h2>

        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded border border-border inline-block" />
            Libre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#22c55e] inline-block" />
            Seleccionado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-secondary border border-border inline-block" />
            Ocupado
          </span>
        </div>

        {slots.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            No hay horarios configurados para esta fecha.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {slots.map((slot, index) => {
              const isSelected =
                range != null && index >= range[0] && index <= range[1];
              const isOccupied = slot.status === "occupied";

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => handleSlotClick(index)}
                  className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-colors ${
                    isOccupied
                      ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                      : isSelected
                        ? "border-[#22c55e] bg-[#22c55e] text-white"
                        : "border-border bg-card text-foreground hover:border-[#22c55e]"
                  }`}
                >
                  <span className="text-sm font-bold">{slot.startTime}</span>
                  <span
                    className={`text-xs ${isSelected ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    {isOccupied ? "Ocupado" : `S/ ${slot.estimatedPrice}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-fit rounded-2xl border border-[#22c55e] bg-card p-5 shadow-sm">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Tu selección
        </p>

        {!range ? (
          <>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Aún sin horario
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecciona de 1 a {MAX_SLOTS} horarios consecutivos para continuar.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              {hours} {hours === 1 ? "hora" : "horas"}
            </h3>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <Calendar size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-foreground font-medium">{formatLongDate(date)}</p>
                <p className="text-muted-foreground">
                  {startTime} — {endTime}
                </p>
              </div>
            </div>
            <div className="mt-3 h-px bg-border" />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-foreground">
                S/ {subtotal.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="mt-4 w-full flex items-center justify-center gap-1 rounded-lg bg-[#22c55e] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
