import { describe, it, expect } from "vitest";
import { monogram, cleanInitials, clubLogo, uniformColors, inkOn, COLOR_SCHEMES, LOGO_STYLES } from "./identity.js";

describe("club identity", () => {
  it("builds initials from city and nickname", () => {
    expect(monogram("Vancouver", "Suns")).toBe("VS");
    expect(monogram("Port Vale", "Cannoneers")).toBe("PC");
    expect(monogram("", "")).toBe("PC");
  });
  it("cleans custom initials", () => {
    expect(cleanInitials("v.s!x9")).toBe("VSX");
    expect(cleanInitials("a&m")).toBe("A&M");
  });
  it("falls back to defaults for older saves", () => {
    const l = clubLogo({ name: "Vancouver", nickname: "Suns" });
    expect(l).toMatchObject({ text: "VS", style: "varsity", scheme: "amber" });
  });
  it("honors a saved identity", () => {
    const l = clubLogo({ name: "Vancouver", nickname: "Suns", logo: { text: "vsn", style: "script", scheme: "royal" } });
    expect(l).toMatchObject({ text: "VSN", style: "script", primary: "#3f6fb5" });
  });
  it("gives the field a visible uniform color", () => {
    const [main, dark] = uniformColors({ logo: { scheme: "gold" } });
    expect(main).toBe("#e0b040"); // black primary swaps to the gold accent
    expect(dark).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("picks readable ink", () => {
    expect(inkOn("#f5edda")).toBe("#12301f");
    expect(inkOn("#1f2f52")).toBe("#f5edda");
  });
  it("has unique ids", () => {
    expect(new Set(COLOR_SCHEMES.map((s) => s[0])).size).toBe(COLOR_SCHEMES.length);
    expect(new Set(LOGO_STYLES.map((s) => s.id)).size).toBe(LOGO_STYLES.length);
  });
});
