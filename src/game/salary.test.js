import { describe, expect, it } from "vitest";
import { salaryOf, luxuryTax } from "./salary.js";
import { SALARY } from "./constants.js";

const batter = (ovr, pos = "1B") => ({
  pos, role: "bat", contact: ovr, power: ovr, eye: ovr, speed: ovr, defense: ovr,
});

describe("salaryOf", () => {
  it("grows with rating", () => {
    expect(salaryOf(batter(85))).toBeGreaterThan(salaryOf(batter(75)));
    expect(salaryOf(batter(75))).toBeGreaterThan(salaryOf(batter(65)));
  });

  it("pays league average the base salary", () => {
    expect(salaryOf(batter(65))).toBe(SALARY.base);
  });

  it("prices positions like baseball: SP > SS > 1B > C", () => {
    const p = { pos: "SP", role: "sp", stuff: 75, control: 75, stamina: 75, defense: 75 };
    expect(salaryOf(p)).toBeGreaterThan(salaryOf(batter(75, "SS")));
    expect(salaryOf(batter(75, "SS"))).toBeGreaterThan(salaryOf(batter(75, "1B")));
    expect(salaryOf(batter(75, "1B"))).toBeGreaterThan(salaryOf(batter(75, "C")));
  });
});

describe("luxuryTax", () => {
  it("charges nothing under the cap", () => {
    expect(luxuryTax(SALARY.cap, 1).tax).toBe(0);
  });

  it("bills 100% of the overage the first year and escalates after", () => {
    const over = SALARY.cap + 10000;
    expect(luxuryTax(over, 1).tax).toBe(10000);
    expect(luxuryTax(over, 2).tax).toBe(15000);
    expect(luxuryTax(over, 3).tax).toBe(20000);
  });
});
