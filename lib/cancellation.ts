/**
 * Política de cancelación. Debe coincidir con BookingServiceImpl.calculateCancellationPenalty del backend:
 * reserva pendiente de pago: sin penalización · VIP con ≥ 12 h: sin penalización · ≥ 24 h: 0 % · 12–24 h: 30 % · < 12 h: 50 %.
 * El backend es quien decide; esto solo anticipa el resultado al usuario.
 */
export function cancellationPolicy({ hoursInAdvance, isVip, unpaid }: { hoursInAdvance: number; isVip: boolean; unpaid: boolean }) {
  if (unpaid) return { percent: 0, reason: "Tu reserva aún no está pagada: se cancela sin costo." };
  if (isVip && hoursInAdvance >= 12) return { percent: 0, reason: "Como miembro VIP cancelas gratis hasta 12 horas antes." };
  if (hoursInAdvance >= 24) return { percent: 0, reason: "Faltan más de 24 horas: cancelación sin penalización." };
  if (hoursInAdvance >= 12) return { percent: 30, reason: "Faltan entre 12 y 24 horas: se aplica una penalización del 30 %." };
  return { percent: 50, reason: "Faltan menos de 12 horas: se aplica una penalización del 50 %." };
}

export function hoursUntil(startsAtIso: string, nowMs: number) {
  return Math.floor((new Date(startsAtIso).getTime() - nowMs) / 3_600_000);
}
