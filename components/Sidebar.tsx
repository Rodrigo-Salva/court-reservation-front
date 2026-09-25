"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  Calendar, 
  Package, 
  CreditCard,
  Clock, 
  User, 
  Settings, 
  BarChart3,
  ScanLine,
  Ban,
  Building2,
  UsersRound,
  Brackets,
  Trophy,
  Zap,
  ReceiptText,
  Star
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "@/app/actions/auth";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon; roles?: string[] }[] = [
  { href: "/explorar", label: "Explorar", icon: Search },
  { href: "/reservas", label: "Reservas", icon: Calendar },
  { href: "/paquetes", label: "Paquetes", icon: Package },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/espera", label: "Espera", icon: Clock },
  { href: "/comunidad", label: "Comunidad", icon: Trophy },
  { href: "/equipos", label: "Equipos", icon: UsersRound },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/administracion", label: "Administración", icon: Settings, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
  { href: "/recepcion", label: "Recepción", icon: ScanLine, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"] },
  { href: "/bloqueos", label: "Bloqueos", icon: Ban, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
  { href: "/transacciones", label: "Transacciones", icon: ReceiptText, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
  { href: "/resenas", label: "Reseñas", icon: Star, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
  { href: "/sedes", label: "Sedes", icon: Building2, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/torneos", label: "Torneos", icon: Brackets, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] },
];

export function Sidebar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(role));

  return (
    <aside className="flex flex-col w-[260px] border-r border-border bg-card h-screen shrink-0 sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-[#4ade80] text-black p-1 rounded">
          <Zap size={20} className="fill-black" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          sportly
        </span>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 mt-2">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-[#dcfce7] text-[#166534]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-[#fffbeb] border border-[#fef08a] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#fef3c7] transition-colors mb-4">
          <div className="flex items-center gap-3">
            <div className="text-[#ca8a04]">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Plan Premium</p>
              <p className="text-[10px] text-neutral-600">12 días de anticipación</p>
            </div>
          </div>
          <span className="text-neutral-500 text-xs">{'>'}</span>
        </div>

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
            {name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email || "usuario@email.com"}</p>
          </div>
          <form action={logout}>
             <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
