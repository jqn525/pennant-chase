import { describe, it, expect } from "vitest";
import { blankState, found, tick, yearReview } from "./franchise.js";
import { REVENUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };

describe("year in review", () => {
  it("best buy is the purchase that earned the most money back, not the highest percentage", () => {
    const s = blankState(); found(s, club); s.unlocked = null;
    for (let i = 0; i < 4; i++) tick(s, "max");
    s.hist.n = 100;
    s.hist.spend.push(
      { n: 10, y: s.year, cat: "upgrades", what: "Cheap thing", cost: 100, gain: 5 },   // $450 back, 450%
      { n: 10, y: s.year, cat: "upgrades", what: "Big thing", cost: 5000, gain: 80 },  // $7,200 back, 144%
    );
    const r = yearReview(s, { w: 50, l: 50, finish: 4, champion: "Somebody", cup: false });
    expect(r.bestBuy).toMatchObject({ what: "Big thing", cost: 5000, earned: 7200, back: 144 });
  });

  it("the merch stand pays back in line with the other first builds", () => {
    expect(REVENUE[0].tiers[0]).toMatchObject({ name: "Merch Stand", cost: 1000 });
  });
});
