import { describe, expect, it } from "vitest";
import { portraitUrl } from "./portrait.js";

const ids = (pos, role, count = 100) => new Set(Array.from({ length: count }, (_, id) => portraitUrl({ id, pos, role })));

describe("portrait pools", () => {
  it("uses expanded, role-specific portrait pools", () => {
    expect(ids("C", "bat").size).toBe(5);
    expect(ids("SP", "SP").size).toBe(10);
    expect(ids("SS", "bat").size).toBe(18);
  });

  it("keeps a player's portrait stable", () => {
    const player = { id: 47, pos: "CF", role: "bat" };
    expect(portraitUrl(player)).toBe(portraitUrl(player));
  });
});
