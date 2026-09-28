import { describe, it, expect } from "vitest";
import { cardPhoto, poseFor, POSE_NAMES, PHOTO_W, PHOTO_H } from "./photo.js";

const POS = ["SP", "RP", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF", "DH"];
const make = (pos, id = 7) => ({ id, name: `Test ${id}`, pos, role: pos === "SP" || pos === "RP" ? pos : "bat" });

describe("card photos", () => {
  it("gives every position its own pose", () => {
    for (const pos of POS) expect(POSE_NAMES).toContain(poseFor(pos));
    expect(new Set(POS.map(poseFor)).size).toBe(POS.length);
  });

  it("fills the whole frame with real colors, in both treatments", () => {
    for (const pos of POS) for (const style of ["photo", "vintage"]) {
      const { w, h, px } = cardPhoto(make(pos), { team: "#3f6fb5", word: "SUNS", initials: "VS", style });
      expect([w, h]).toEqual([PHOTO_W, PHOTO_H]);
      expect(px.length).toBe(w * h);
      expect(px.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
    }
  });

  it("is stable per player and changes with the print treatment", () => {
    const p = make("SS", 42);
    expect(cardPhoto(p, { style: "photo" }).px).toEqual(cardPhoto(p, { style: "photo" }).px);
    expect(cardPhoto(p, { style: "vintage" }).px).not.toEqual(cardPhoto(p, { style: "photo" }).px);
  });

  it("wears the club's colors and name", () => {
    const p = make("DH", 9);
    const a = cardPhoto(p, { team: "#3f6fb5", word: "SUNS" }).px;
    const b = cardPhoto(p, { team: "#c6503f", word: "SUNS" }).px;
    const c = cardPhoto(p, { team: "#3f6fb5", word: "HAWKS" }).px;
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });
});
