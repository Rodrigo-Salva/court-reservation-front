export type NavIcon =
  | "search" | "calendar" | "package" | "payments" | "clock" | "community" | "teams"
  | "reception" | "blocks" | "tournaments" | "admin" | "transactions" | "reviews" | "reports" | "venues" | "profile";

export type NavItem = { href: string; label: string; icon: NavIcon; roles: readonly string[] };
export type NavSection = { title: string; items: readonly NavItem[] };

const PLAYER = ["USER"] as const;
const STAFF = ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN", "RECEPTIONIST"] as const;
const MANAGERS = ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"] as const;
const GLOBAL_ADMINS = ["ADMIN", "SUPER_ADMIN"] as const;
const EVERYONE = ["USER", ...STAFF] as const;

/**
 * Menú lateral por rol. Los jugadores ven su actividad; el personal ve solo las herramientas de operación
 * y gestión de su sede. Ocultar un enlace no es una barrera de seguridad: cada página y el backend validan el rol.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Mi actividad",
    items: [
      { href: "/explorar", label: "Explorar", icon: "search", roles: PLAYER },
      { href: "/reservas", label: "Reservas", icon: "calendar", roles: PLAYER },
      { href: "/paquetes", label: "Paquetes", icon: "package", roles: PLAYER },
      { href: "/pagos", label: "Pagos", icon: "payments", roles: PLAYER },
      { href: "/espera", label: "Espera", icon: "clock", roles: PLAYER },
      { href: "/comunidad", label: "Comunidad", icon: "community", roles: PLAYER },
      { href: "/equipos", label: "Equipos", icon: "teams", roles: PLAYER },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/recepcion", label: "Recepción", icon: "reception", roles: STAFF },
      { href: "/bloqueos", label: "Bloqueos", icon: "blocks", roles: MANAGERS },
      { href: "/torneos", label: "Torneos", icon: "tournaments", roles: MANAGERS },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/administracion", label: "Administración", icon: "admin", roles: MANAGERS },
      { href: "/transacciones", label: "Transacciones", icon: "transactions", roles: MANAGERS },
      { href: "/resenas", label: "Reseñas", icon: "reviews", roles: MANAGERS },
      { href: "/reportes", label: "Reportes", icon: "reports", roles: MANAGERS },
      { href: "/sedes", label: "Sedes", icon: "venues", roles: GLOBAL_ADMINS },
    ],
  },
  {
    title: "Cuenta",
    items: [{ href: "/perfil", label: "Perfil", icon: "profile", roles: EVERYONE }],
  },
];

/** Secciones con los enlaces que corresponden al rol; las secciones vacías se omiten. */
export function visibleSections(role: string): NavSection[] {
  return NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(role)) }))
    .filter((section) => section.items.length > 0);
}

/** Pantalla a la que se entra después de iniciar sesión. */
export function homePathFor(role: string): string {
  if (role === "RECEPTIONIST") return "/recepcion";
  if ((MANAGERS as readonly string[]).includes(role)) return "/administracion";
  return "/explorar";
}
