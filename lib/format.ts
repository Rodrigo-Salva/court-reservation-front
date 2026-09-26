/** Utilidades de formato para pantallas. Las fechas llegan como yyyy-MM-dd y las horas como HH:mm[:ss]. */

const parts = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function dateBlock(iso: string) {
  const date = parts(iso);
  const clean = (text: string) => text.replace(".", "").toUpperCase();
  return {
    weekday: clean(new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(date)),
    day: String(date.getDate()),
    month: clean(new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date)),
  };
}

/** "14 oct 2026" */
export function shortDate(iso: string) {
  return parts(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

/** "sábado, 26 de setiembre de 2026" con la primera letra en mayúscula. */
export function longDate(iso: string) {
  const text = parts(iso).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const hhmm = (time: string) => time.slice(0, 5);
export const money = (value: number | string | undefined | null) => `S/ ${Number(value ?? 0).toFixed(2)}`;

/** Instante de inicio de una reserva, para separar próximas de pasadas. */
export const startsAt = (date: string, time: string) => new Date(`${date.slice(0, 10)}T${hhmm(time)}:00`).getTime();

/** Instante actual en ms; se aísla aquí para no llamar a Date.now() dentro de componentes. */
export const nowMs = () => Date.now();
