import { describe, expect, it } from "vitest";
import { cancellationPolicy, hoursUntil } from "./cancellation";

const policy = (hoursInAdvance: number, isVip = false, unpaid = false) => cancellationPolicy({ hoursInAdvance, isVip, unpaid }).percent;

describe("cancellationPolicy", () => {
  it("24 horas o más: sin penalización", () => {
    expect(policy(24)).toBe(0);
    expect(policy(72)).toBe(0);
  });

  it("entre 12 y 24 horas: 30 %", () => {
    expect(policy(23)).toBe(30);
    expect(policy(12)).toBe(30);
  });

  it("menos de 12 horas: 50 %", () => {
    expect(policy(11)).toBe(50);
    expect(policy(0)).toBe(50);
  });

  it("VIP cancela gratis hasta 12 horas antes, y después paga 50 %", () => {
    expect(policy(12, true)).toBe(0);
    expect(policy(13, true)).toBe(0);
    expect(policy(11, true)).toBe(50);
  });

  it("una reserva sin pagar no tiene penalización", () => {
    expect(policy(1, false, true)).toBe(0);
  });
});

describe("hoursUntil", () => {
  it("cuenta horas enteras hasta el inicio", () => {
    const now = new Date("2026-09-25T10:00:00").getTime();
    expect(hoursUntil("2026-09-26T12:30:00", now)).toBe(26);
    expect(hoursUntil("2026-09-25T10:59:00", now)).toBe(0);
  });
});
