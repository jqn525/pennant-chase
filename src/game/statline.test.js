import { describe, it, expect } from "vitest";
import { avg, obp, slg, era, whip, ip, k9, statLine } from "./statline.js";

const Z = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };

describe("stat lines", () => {
  it("shows dashes with no playing time", () => {
    expect(avg(Z)).toBe("—");
    expect(obp(Z)).toBe("—");
    expect(era(Z)).toBe("—");
    expect(whip(Z)).toBe("—");
    expect(ip(Z)).toBe("0.0");
    expect(k9(Z)).toBe("—");
  });
  it("computes batting rates", () => {
    const s = { ...Z, ab: 10, h: 3, d: 1, t: 0, hr: 1, bb: 2 };
    expect(avg(s)).toBe(".300");
    expect(obp(s)).toBe(".417");
    expect(slg(s)).toBe(".700"); // 1B + 2B(2) + HR(4) = 7 TB
  });
  it("computes pitching rates", () => {
    const s = { ...Z, outsP: 27, raP: 3, hP: 7, bbP: 2, kP: 9 };
    expect(ip(s)).toBe("9.0");
    expect(era(s)).toBe("3.00");
    expect(whip(s)).toBe("1.00");
    expect(k9(s)).toBe("9.0");
    expect(ip({ ...s, outsP: 20 })).toBe("6.2");
  });
  it("orders the headline stats first", () => {
    expect(statLine(Z, true)[0][0]).toBe("AVG");
    expect(statLine(Z, false)[0][0]).toBe("ERA");
  });
});
