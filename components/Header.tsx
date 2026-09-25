"use client";

import { Moon, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header({ name }: { name: string }) {
  const pathname = usePathname();
  
  let title = "";
  if (pathname.startsWith("/explorar")) title = "Encuentra tu cancha";
  else if (pathname.startsWith("/reservas")) title = "Mis reservas";
  else if (pathname.startsWith("/paquetes")) title = "Paquetes";
  else if (pathname.startsWith("/espera")) title = "Lista de espera";
  else if (pathname.startsWith("/perfil")) title = "Mi Perfil";
  else if (pathname.startsWith("/administracion")) title = "Administración";
  else if (pathname.startsWith("/pagos")) title = "Pagos";
  else if (pathname.startsWith("/notificaciones")) title = "Notificaciones";

  return (
    <header className="flex h-16 items-center justify-between px-8 border-b border-border bg-background shrink-0">
      <h1 className="text-lg font-bold text-foreground font-display">
        {title}
      </h1>
      
      <div className="flex items-center gap-4 text-muted-foreground">
        <button className="hover:text-foreground transition-colors">
          <Moon size={20} />
        </button>
        <Link href="/notificaciones" className="hover:text-foreground transition-colors" aria-label="Ver notificaciones">
          <Bell size={20} />
        </Link>
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs ml-2">
          {name.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
