import { describe, expect, it } from "vitest";
import { seedOrder } from "./season.js";

describe("seedOrder", () => {
  it("uses a stable club id tie-break and returns the same result repeatedly", () => {
    const standings = Array.from({ length: 8 }, () => ({ w: 77, l: 77 }));
    const ratings = Array(8).fill(65);
    const expected = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = 0; i < 20; i++) expect(seedOrder(standings, ratings)).toEqual(expected);
  });

  it("prioritizes wins and rating before club id", () => {
    const standings = Array.from({ length: 8 }, (_, i) => ({ w: i === 4 ? 80 : 70, l: 0 }));
    const ratings = Array(8).fill(60);
    ratings[6] = 70;
    expect(seedOrder(standings, ratings).slice(0, 2)).toEqual([4, 6]);
  });
});
