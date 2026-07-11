import { describe, expect, it } from "vitest";
import { gearArtUrl } from "./gear.js";

describe("gear artwork", () => {
  it("uses dedicated artwork for legendary items", () => {
    expect(gearArtUrl({ id: "x", slot: "glove", rarity: 3 })).toContain("gear/glove-legendary.png");
  });

  it("keeps generated variants for non-legendary items", () => {
    expect(gearArtUrl({ id: "x", slot: "glove", rarity: 2 })).toMatch(/gear\/glove(?:2|3)?\.png$/);
  });
});
