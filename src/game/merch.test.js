import { describe, it, expect } from "vitest";
import { rollAwaySales, expectedAway, effectiveDays, drawBuyers } from "./merch.js";
import { blankState, found, welcomeBack, ledgerNet, build } from "./franchise.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("away sales", () => {
  it("rolls average out to the expected value; small clubs swing", () => {
    const opts = { fans: 1000, store: 1, hours: 24 };
    const rolls = Array.from({ length: 3000 }, () => rollAwaySales(opts).total);
    const ev = expectedAway(opts);
    expect(mean(rolls)).toBeGreaterThan(ev * 0.95);
    expect(mean(rolls)).toBeLessThan(ev * 1.05);
    const sd = Math.sqrt(mean(rolls.map((x) => (x - ev) ** 2)));
    expect(sd / ev).toBeGreaterThan(0.1);
    expect(ev).toBeGreaterThan(60);
    expect(ev).toBeLessThan(140);
  });

  it("the stand sells caps; jerseys need the team store; memorabilia the flagship", () => {
    const ids = (store) => rollAwaySales({ fans: 1e6, store, hours: 24 }).items.map((i) => i.id);
    expect(ids(0)).toEqual([]);
    expect(ids(1)).toEqual(["cap"]);
    expect(ids(2)).toEqual(["cap", "jersey"]);
    expect(ids(3)).toEqual(["cap", "jersey", "memo"]);
  });

  it("interest fades: no fixed cap, but a week is barely more than two days", () => {
    expect(effectiveDays(48) / effectiveDays(24)).toBeLessThan(1.6);
    expect(effectiveDays(24 * 7) / effectiveDays(24)).toBeLessThan(2.1);
    expect(effectiveDays(24 * 365)).toBeLessThan(2 / Math.LN2 * 1.01);
  });

  it("star power, form and TV raise the odds", () => {
    const base = { fans: 100000, store: 3, hours: 24 };
    expect(expectedAway({ ...base, draw: 3 })).toBeGreaterThan(expectedAway(base));
    expect(expectedAway({ ...base, form: 0.9 })).toBeGreaterThan(expectedAway({ ...base, form: 0.2 }));
    expect(expectedAway({ ...base, tv: 2 })).toBeGreaterThan(expectedAway(base));
  });

  it("a big club with a flagship earns tens of thousands a day, not millions", () => {
    const ev = expectedAway({ fans: 280000, store: 3, hours: 24, draw: 2, form: 0.6, tv: 1 });
    expect(ev).toBeGreaterThan(40000);
    expect(ev).toBeLessThan(90000);
    expect(drawBuyers(0)).toBe(0);
  });

  it("welcome back books the receipt in the ledger", () => {
    const s = blankState(); found(s, club);
    s.fans = 20000; s.money = 1e5; build(s, "merch");
    const start = s.money;
    s.lastSeen = Date.now() - 10 * 3600e3;
    welcomeBack(s);
    expect(s.money).toBeGreaterThan(start);
    expect(s.money).toBeCloseTo(1e5 + ledgerNet(s.ledger.life) - 0, 0);
    expect(s.log[0].text).toMatch(/fans bought \d[\d,]* caps?/);
  });
});
