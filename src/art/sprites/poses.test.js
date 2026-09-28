import { describe, it, expect } from "vitest";
import { poseFrame, poseFor, POSE_NAMES } from "./poses.js";
import { parseFrame, resolveFrame } from "../sprite.js";

const POS = ["SP", "RP", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF", "DH"];

describe("card poses", () => {
  it("every position has its own named pose", () => {
    for (const pos of POS) expect(POSE_NAMES).toContain(poseFor(pos));
    expect(new Set(POS.map(poseFor)).size).toBeGreaterThanOrEqual(10);
  });
  it("renders a full 64x72 scene with only palette colors", () => {
    for (const pos of POS) {
      const rows = poseFrame({ id: 7, name: "Test", pos, role: pos === "SP" || pos === "RP" ? pos : "bat" });
      expect(rows.length).toBe(72);
      expect(rows.every((r) => r.length === 64)).toBe(true);
      expect(resolveFrame(parseFrame(rows)).every((c) => c && /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
    }
  });
  it("is stable per player", () => {
    const p = { id: 42, name: "Same", pos: "SS", role: "bat" };
    expect(poseFrame(p)).toEqual(poseFrame(p));
  });
});
