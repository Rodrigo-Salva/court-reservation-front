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
import { visibleSections, type NavIcon } from "@/lib/navigation";

const ICONS: Record<NavIcon, LucideIcon> = {
  search: Search,
  calendar: Calendar,
  package: Package,
  payments: CreditCard,
  clock: Clock,
  community: Trophy,
  teams: UsersRound,
  reception: ScanLine,
  blocks: Ban,
  tournaments: Brackets,
  admin: Settings,
  transactions: ReceiptText,
  reviews: Star,
  reports: BarChart3,
  venues: Building2,
  profile: User,
};

export function Sidebar({
  name,
  email,
  role,
  open = false,
  onClose,
}: {
  name: string;
  email: string;
  role: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const sections = visibleSections(role);

  return (
    <>
    {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-65 flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="p-6 flex items-center gap-2">
        <div className="bg-[#4ade80] text-black p-1 rounded">
          <Zap size={20} className="fill-black" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          sportly
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 mt-2" aria-label="Navegación principal">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = ICONS[link.icon];

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
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
          </div>
        ))}
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
    </>
  );
}
