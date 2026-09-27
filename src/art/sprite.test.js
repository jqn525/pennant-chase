import { describe, it, expect } from "vitest";
import { parseFrame, resolveFrame, flipFrame, frameAt } from "./sprite.js";
import { FR, ANIM } from "./sprites/players.js";
import { PAL } from "./palette.js";

describe("sprites", () => {
  it("parses frames and rejects ragged rows", () => {
    expect(parseFrame(["ab", "cd"])).toMatchObject({ w: 2, h: 2 });
    expect(() => parseFrame(["ab", "c"])).toThrow();
  });

  it("resolves palette keys, transparency and swaps", () => {
    const cols = resolveFrame(parseFrame([".k", "cw"]), { c: "#123456" });
    expect(cols).toEqual([null, PAL.k, "#123456", PAL.w]);
  });

  it("mirrors frames", () => {
    expect(flipFrame(["ab.", "..c"])).toEqual([".ba", "c.."]);
  });

  it("every player frame uses only known palette keys and shares a baseline", () => {
    for (const [name, f] of Object.entries(FR)) {
      expect(f.h, name).toBe(13);
      for (const ch of f.px) expect(ch === "." || ch in PAL, `${name}:${ch}`).toBe(true);
    }
  });

  it("frameAt loops or holds", () => {
    expect(frameAt(ANIM.run, 0)).toBe(FR.runA);
    expect(frameAt(ANIM.run, 100)).toBe(FR.runB);
    expect(frameAt(ANIM.windup, 99999)).toBe(FR.ready);
  });
});
