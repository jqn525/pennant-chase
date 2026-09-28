import { describe, expect, it } from "vitest";
import { portraitFrames, portraitSwap, features } from "../art/sprites/portraits.js";
import { gearRows, gearSwap, GEAR_SLOTS } from "../art/sprites/gear.js";
import { ICON_BITS } from "./Icons.jsx";
import { parseFrame, resolveFrame } from "../art/sprite.js";
import { skinFor } from "../art/palette.js";

const player = (id, pos = "SS", role = "bat") => ({ id, pos, role, name: `Player ${id}` });
const valid = (rows, swap) => resolveFrame(parseFrame(rows), swap).every((c) => c === null || /^#[0-9a-f]{6}$/i.test(c));

describe("portraits", () => {
  it("are 32x32 in every frame and use only palette colors", () => {
    const f = portraitFrames(player(7));
    for (const k of ["base", "blink", "breathe"]) {
      expect(f[k].length).toBe(32);
      expect(f[k].every((r) => r.length === 32)).toBe(true);
      expect(valid(f[k], portraitSwap(player(7)))).toBe(true);
    }
  });

  it("keeps a player's face stable and matches his field sprite's skin", () => {
    const p = player(47, "CF");
    expect(portraitFrames(p).base).toEqual(portraitFrames(p).base);
    expect(portraitSwap(p).s).toBe(skinFor(47)[0]);
  });

  it("gives the roster a variety of faces", () => {
    const faces = new Set(Array.from({ length: 40 }, (_, i) => portraitFrames(player(i)).base.join("")));
    expect(faces.size).toBeGreaterThan(30);
  });

  it("dresses catchers and pitchers for the job", () => {
    expect(features(player(3, "C")).role).toBe("catcher");
    expect(features(player(3, "SP", "SP")).role).toBe("pitcher");
    expect(portraitFrames(player(3, "C")).base.join("")).toContain("n"); // chest protector
  });

  it("blinks", () => {
    const f = portraitFrames(player(12));
    expect(f.blink).not.toEqual(f.base);
  });
});

describe("gear icons", () => {
  it("draw every slot at 16x16, legendary in gold", () => {
    for (const slot of GEAR_SLOTS) {
      const rows = gearRows(slot, false);
      expect(rows.length).toBe(16);
      expect(valid(rows, gearSwap({ slot, id: "x" }))).toBe(true);
    }
    expect(gearSwap({ slot: "bat", rarity: 3 }).c).toBe("#ffd75a");
  });
  it("same item, same colorway", () => {
    expect(gearSwap({ slot: "glove", id: "g-9", rarity: 1 })).toEqual(gearSwap({ slot: "glove", id: "g-9", rarity: 1 }));
  });
});

describe("pixel icons", () => {
  it("are all 12x12", () => {
    for (const [name, rows] of Object.entries(ICON_BITS)) {
      expect(rows.length, name).toBe(12);
      rows.forEach((r) => expect(r.length, name).toBe(12));
    }
  });
});
