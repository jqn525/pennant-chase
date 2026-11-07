import { describe, it, expect } from "vitest";
import { blankState, found, tick, allPlayers, ledgerNet, toSave, loadState } from "./franchise.js";
import { ovr } from "./gear.js";
import { options } from "./advisor.js";
import { spendOptimally, runRules, addRule, removeRule, moveRule, toggleRule, reserveOf, describeRule } from "./rules.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); return s; };

describe("spend optimally", () => {
  it("buys best payback first, respects budget and reserve, and books it all", () => {
    const s = fresh();
    const start = s.money;
    const first = options(s).find((o) => o.affordable && o.gainPerGame > 0);
    const rc = spendOptimally(s, { budget: 1000, reserve: 500 });
    expect(rc.items.length).toBeGreaterThan(0);
    expect(rc.items[0].id).toBe(first.id);
    expect(rc.spent).toBeLessThanOrEqual(1000);
    expect(s.money).toBeGreaterThanOrEqual(500);
    expect(s.money).toBeCloseTo(start - rc.spent, 6);
    expect(s.money).toBeCloseTo(start + ledgerNet(s.ledger.life), 6);
    expect(s.log[0].kind).toBe("rule");
  });

  it("stops at the reserve when the budget is unlimited", () => {
    const s = fresh();
    s.money = 50000;
    spendOptimally(s, { reserve: 20000 });
    expect(s.money).toBeGreaterThanOrEqual(20000);
  });
});

describe("rules", () => {
  it("a build rule waits for its condition, fires once, then is done", () => {
    const s = fresh();
    addRule(s, { type: "build", track: "merch", when: "fans", n: 3000 });
    s.money = 10000; s.fans = 2000;
    expect(runRules(s)).toEqual([]);
    expect(s.merch).toBe(0);
    s.fans = 3000;
    expect(runRules(s).length).toBe(1);
    expect(s.merch).toBe(1);
    expect(s.rules[0].done).toBe(true);
    expect(runRules(s)).toEqual([]);
    expect(s.merch).toBe(1);
  });

  it("the reserve guards every automated spend", () => {
    const s = fresh();
    addRule(s, { type: "reserve", n: 9800 });
    addRule(s, { type: "build", track: "merch", when: "fans", n: 0 });
    addRule(s, { type: "auto", payback: 1e9 });
    s.money = 10000; s.fans = 2000;
    expect(reserveOf(s)).toBe(9800);
    runRules(s);
    expect(s.merch).toBe(0); // $250 would break the reserve
    expect(s.money).toBeGreaterThanOrEqual(9800);
  });

  it("a train rule trains until the target overall, then retires", () => {
    const s = fresh();
    const p = s.roster.batters[0];
    const target = Math.ceil(ovr(p)) + 1;
    addRule(s, { type: "train", pid: p.id, ovr: target });
    s.money = 100000;
    runRules(s);
    const after = allPlayers(s).find((x) => x.id === p.id);
    expect(ovr(after)).toBeGreaterThanOrEqual(target);
    expect(s.rules[0].done).toBe(true);
    expect(describeRule(s, s.rules[0])).toMatch(after.name);
  });

  it("an auto rule only buys within its payback window", () => {
    const s = fresh();
    s.money = 100000;
    addRule(s, { type: "auto", payback: 5 });
    runRules(s);
    // everything still on offer pays back slower than 5 games, or isn't affordable
    expect(options(s).some((o) => o.affordable && o.gainPerGame > 0 && o.payback <= 5)).toBe(false);
  });

  it("edits: move, toggle, remove, and survive a save", () => {
    const s = fresh();
    addRule(s, { type: "reserve", n: 100 });
    addRule(s, { type: "auto", payback: 30 });
    moveRule(s, s.rules[1].id, -1);
    expect(s.rules[0].type).toBe("auto");
    toggleRule(s, s.rules[0].id);
    expect(s.rules[0].off).toBe(true);
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.rules.map((r) => r.type)).toEqual(["auto", "reserve"]);
    removeRule(s, s.rules[0].id);
    expect(s.rules.length).toBe(1);
  });

  it("runs alongside a headless season without breaking the books", () => {
    const s = fresh();
    const start = s.money;
    addRule(s, { type: "reserve", n: 500 });
    addRule(s, { type: "auto", payback: 60 });
    for (let i = 0; i < 60; i++) { tick(s, "max"); runRules(s); }
    expect(s.money).toBeCloseTo(start + ledgerNet(s.ledger.life), 6);
    expect(s.money).toBeGreaterThanOrEqual(0);
  });
});
