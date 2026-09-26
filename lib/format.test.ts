import { describe, expect, it } from "vitest";
import { dateBlock, hhmm, longDate, money, startsAt } from "./format";

describe("format", () => {
  it("bloque de fecha sin puntos y en mayúsculas", () => {
    const block = dateBlock("2026-09-21");
    expect(block.day).toBe("21");
    expect(block.month).not.toContain(".");
    expect(block.month).toBe(block.month.toUpperCase());
  });

  it("no depende de la zona horaria al interpretar yyyy-MM-dd", () => {
    expect(dateBlock("2026-01-01").day).toBe("1");
    expect(dateBlock("2026-12-31").day).toBe("31");
  });

  it("fecha larga con la primera letra en mayúscula", () => {
    expect(longDate("2026-09-26")).toMatch(/^[A-ZÁÉÍÓÚ]/);
    expect(longDate("2026-09-26")).toContain("2026");
  });

  it("hora y dinero", () => {
    expect(hhmm("14:30:00")).toBe("14:30");
    expect(money(68)).toBe("S/ 68.00");
    expect(money(undefined)).toBe("S/ 0.00");
  });

  it("ordena reservas por inicio", () => {
    expect(startsAt("2026-09-21", "14:00:00")).toBeLessThan(startsAt("2026-09-21", "15:00"));
    expect(startsAt("2026-09-21", "23:00")).toBeLessThan(startsAt("2026-09-22", "06:00"));
  });
});
