import { Calendar, Percent, Zap } from "lucide-react";

const FEATURES = [
  { icon: Zap, text: "Reserva tu cancha en segundos" },
  { icon: Percent, text: "Descuentos por membresía y paquetes de horas" },
  { icon: Calendar, text: "Lista de espera automática si está ocupada" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Panel de marca */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#166534] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative flex items-center gap-2">
          <div className="rounded bg-[#4ade80] p-1 text-black">
            <Zap size={20} className="fill-black" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            sportly
          </span>
        </div>

        <div className="relative">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Tu próxima cancha,
            <br />
            <span className="text-[#86efac]">a un toque.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Explora, reserva y gestiona tus partidos en un solo lugar.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Sportly
        </p>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Sport<span className="text-primary">ly</span>
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu próxima cancha, a un toque
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
