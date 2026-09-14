import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren sesion iniciada.
// /explorar es publico a proposito: cualquiera puede ver canchas sin loguearse,
// pero reservar, comprar un paquete, etc. sigue exigiendo login.
const PROTECTED_ROUTES = ["/reservas", "/paquetes", "/espera", "/perfil", "/administracion"];
// Rutas publicas de auth: si ya hay sesion, no tiene sentido mostrarlas.
const AUTH_ROUTES = ["/login", "/registro"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("session")?.value);

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/explorar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
