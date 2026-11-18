import { describe, it, expect } from "vitest";
import { blankState, found, tick, yearReview } from "./franchise.js";
import { REVENUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };

describe("year in review", () => {
  it("the year's biggest investment is the most expensive purchase, with no estimated return", () => {
    const s = blankState(); found(s, club); s.unlocked = null;
    for (let i = 0; i < 4; i++) tick(s, "max");
    s.hist.spend.push(
      { n: 10, y: s.year, cat: "upgrades", what: "Cheap thing", cost: 100, gain: 5 },
      { n: 10, y: s.year, cat: "upgrades", what: "Big thing", cost: 5000, gain: 80 },
    );
    const r = yearReview(s, { w: 50, l: 50, finish: 4, champion: "Somebody", cup: false });
    expect(r.bestBuy).toEqual({ what: "Big thing", name: undefined, cost: 5000 });
  });

  it("the merch stand pays back in line with the other first builds", () => {
    expect(REVENUE[0].tiers[0]).toMatchObject({ name: "Merch Stand", cost: 1000 });
  });
});
