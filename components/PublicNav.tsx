import Link from "next/link";
import { Zap } from "lucide-react";

export function PublicNav() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 sm:px-8">
      <div className="flex items-center gap-2">
        <div className="bg-[#4ade80] text-black p-1 rounded">
          <Zap size={20} className="fill-black" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          sportly
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Regístrate
        </Link>
      </div>
    </header>
  );
}
