import { describe, expect, it } from "vitest";
import { extractCheckInCode } from "./checkinCode";

const CODE = "3f2b8c1e-9a4d-4e7b-8c55-1d2e3f4a5b6c";

describe("extractCheckInCode", () => {
  it("devuelve el UUID tal cual", () => {
    expect(extractCheckInCode(CODE)).toBe(CODE);
  });

  it("ignora espacios y saltos de línea alrededor", () => {
    expect(extractCheckInCode(`  ${CODE}\n`)).toBe(CODE);
  });

  it("normaliza a minúsculas", () => {
    expect(extractCheckInCode(CODE.toUpperCase())).toBe(CODE);
  });

  it("lo extrae de una URL, un JSON o un prefijo", () => {
    expect(extractCheckInCode(`https://sportly.app/checkin/${CODE}?x=1`)).toBe(CODE);
    expect(extractCheckInCode(`{"bookingId":12,"code":"${CODE}"}`)).toBe(CODE);
    expect(extractCheckInCode(`12:${CODE}`)).toBe(CODE);
  });

  it("acepta un código corto sin espacios (ingreso manual)", () => {
    expect(extractCheckInCode("ABC123")).toBe("ABC123");
  });

  it("rechaza vacío, texto con espacios o demasiado largo", () => {
    expect(extractCheckInCode("")).toBeNull();
    expect(extractCheckInCode("   ")).toBeNull();
    expect(extractCheckInCode("hola mundo")).toBeNull();
    expect(extractCheckInCode("x".repeat(65))).toBeNull();
  });
});
