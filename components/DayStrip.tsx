import Link from "next/link";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jué", "Vie", "Sáb"];
const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DayStrip({
  courtId,
  selectedDate,
}: {
  courtId: number;
  selectedDate: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const monthLabel = `${MONTH_LABELS[days[0].getMonth()]} ${days[0].getFullYear()}`;

  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
        {monthLabel}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {days.map((d) => {
          const iso = toISODate(d);
          const isSelected = iso === selectedDate;
          return (
            <Link
              key={iso}
              href={`/reservas/nueva?courtId=${courtId}&date=${iso}`}
              className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-colors ${
                isSelected
                  ? "bg-[#22c55e] border-[#22c55e] text-white"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase ${
                  isSelected ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                {DAY_LABELS[d.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">
                {d.getDate()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
