import { describe, expect, it } from "vitest";
import { homePathFor, visibleSections } from "./navigation";

const hrefs = (role: string) => visibleSections(role).flatMap((section) => section.items.map((item) => item.href));

describe("visibleSections", () => {
  it("el jugador solo ve su actividad y su perfil", () => {
    expect(hrefs("USER")).toEqual(["/explorar", "/reservas", "/paquetes", "/pagos", "/espera", "/comunidad", "/equipos", "/perfil"]);
  });

  it("el administrador NO ve las pantallas de jugador", () => {
    const admin = hrefs("ADMIN");
    for (const playerOnly of ["/explorar", "/reservas", "/paquetes", "/pagos", "/espera", "/comunidad", "/equipos"]) {
      expect(admin).not.toContain(playerOnly);
    }
  });

  it("el administrador ve operación, gestión y sedes", () => {
    expect(hrefs("ADMIN")).toEqual(["/recepcion", "/bloqueos", "/torneos", "/administracion", "/transacciones", "/resenas", "/reportes", "/sedes", "/perfil"]);
    expect(hrefs("SUPER_ADMIN")).toContain("/sedes");
  });

  it("el admin de sede ve lo mismo salvo Sedes", () => {
    const venueAdmin = hrefs("VENUE_ADMIN");
    expect(venueAdmin).toContain("/administracion");
    expect(venueAdmin).toContain("/recepcion");
    expect(venueAdmin).not.toContain("/sedes");
    expect(venueAdmin).not.toContain("/reservas");
  });

  it("la recepción solo ve Recepción y su perfil", () => {
    expect(hrefs("RECEPTIONIST")).toEqual(["/recepcion", "/perfil"]);
  });

  it("omite las secciones vacías", () => {
    expect(visibleSections("RECEPTIONIST").map((section) => section.title)).toEqual(["Operación", "Cuenta"]);
    expect(visibleSections("USER").map((section) => section.title)).toEqual(["Mi actividad", "Cuenta"]);
  });

  it("un rol desconocido no ve nada", () => {
    expect(hrefs("OTRO")).toEqual([]);
  });
});

describe("homePathFor", () => {
  it("lleva a cada rol a su pantalla natural", () => {
    expect(homePathFor("USER")).toBe("/explorar");
    expect(homePathFor("RECEPTIONIST")).toBe("/recepcion");
    for (const role of ["ADMIN", "SUPER_ADMIN", "VENUE_ADMIN"]) expect(homePathFor(role)).toBe("/administracion");
  });
});
