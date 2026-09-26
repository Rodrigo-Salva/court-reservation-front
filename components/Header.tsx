"use client";

import { Bell, Menu, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/navigation";

const EXTRA_TITLES: Record<string, string> = { "/notificaciones": "Notificaciones", "/perfil": "Mi perfil" };

/** Título de la sección actual: sale del mismo menú de navegación para no duplicar nombres. */
function titleFor(pathname: string) {
  const items = NAV_SECTIONS.flatMap((section) => section.items);
  return items.find((item) => pathname.startsWith(item.href))?.label ?? EXTRA_TITLES[pathname] ?? "";
}

export function Header({ name, onMenu }: { name: string; onMenu?: () => void }) {
  const pathname = usePathname();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Abrir menú">
          <Menu size={18} />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">{titleFor(pathname)}</h1>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <button type="button" className="transition-colors hover:text-foreground" aria-label="Cambiar tema">
          <Moon size={20} />
        </button>
        <Link href="/notificaciones" className="transition-colors hover:text-foreground" aria-label="Ver notificaciones">
          <Bell size={20} />
        </Link>
        <div className="ml-2 flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
          {name.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
