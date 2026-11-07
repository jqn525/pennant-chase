import { describe, it, expect } from "vitest";
import { blankState, found, tick, closeDraft, ledgerNet, credit, merchTick, build, buildLock, train, toSave, loadState, trainCost, allPlayers } from "./franchise.js";
import { validateSave } from "./save.js";
import { LEAGUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); return s; };

// Play until the season rolls over to the draft (or a cap on ticks)
function playSeason(s) {
  const year = s.year;
  for (let i = 0; i < 400 && !(s.phase === "draft" && s.year > year); i++) tick(s, "max");
}

describe("franchise core", () => {
  it("plays a full season through playoffs and winter, headless", () => {
    const s = fresh();
    playSeason(s);
    expect(s.phase).toBe("draft");
    expect(s.year).toBe(2);
    expect(s.history.length).toBe(1);
    expect(s.draftClass.length).toBeGreaterThan(0);
    closeDraft(s);
    expect(s.phase).toBe("regular");
    tick(s, "max");
    expect(s.gameIndex).toBe(1);
  });

  it("the ledger explains every dollar", () => {
    const s = fresh();
    const start = s.money;
    for (let i = 0; i < 40; i++) tick(s, "max");
    merchTick(s, 5); // no store yet: nothing
    s.money += 20000; s.ledger.life.seed = 20000; // test injection, booked as its own line
    s.fans = 20000;
    expect(build(s, "merch")).toBe(true);
    merchTick(s, 10);
    const pid = s.roster.batters[0].id;
    train(s, pid, "contact", 3);
    expect(s.money).toBeCloseTo(start + ledgerNet(s.ledger.life), 6);
    expect(s.ledger.life.gate).toBeGreaterThan(0);
    expect(s.ledger.life.payroll).toBeLessThan(0);
    expect(s.ledger.life.merch).toBeGreaterThan(0);
  });

  it("plays at watchable speed, dripping the gate per half-inning", () => {
    const s = fresh();
    for (let i = 0; i < 200 && s.gameIndex < 1; i++) tick(s, 4);
    expect(s.gameIndex).toBe(1);
    expect(s.ledger.season.gate).toBeGreaterThan(0);
    expect(s.results[0]).toMatchObject({ year: 1 });
  });

  it("respects money and fan gates on builds and training", () => {
    const s = fresh();
    s.money = 100;
    expect(buildLock(s, "seats")).toMatch(/fans/);
    expect(build(s, "seats")).toBe(false);
    const p = s.roster.batters[0];
    const before = s.money;
    expect(train(s, p.id, "power", 1, 1)).toBe(false); // budget too small
    expect(s.money).toBe(before);
    expect(trainCost(s, { power: 66 }, "power")).toBeGreaterThan(trainCost(s, { power: 60 }, "power"));
  });

  it("saves and reloads", () => {
    const s = fresh();
    for (let i = 0; i < 12; i++) tick(s, "max");
    const data = JSON.parse(JSON.stringify(toSave(s)));
    expect(validateSave(data)).toBeNull();
    const t = loadState(data);
    expect(t.money).toBeCloseTo(s.money);
    expect(t.gameIndex).toBe(s.gameIndex);
    expect(allPlayers(t).length).toBe(11);
    expect(t.ledger.season.gate).toBeCloseTo(s.ledger.season.gate);
  });

  it("loads a save from before the ledger existed", () => {
    const s = fresh();
    for (let i = 0; i < 5; i++) tick(s, "max");
    const old = JSON.parse(JSON.stringify(toSave(s)));
    delete old.ledger; delete old.rules; delete old.autoLineup; delete old.results;
    const t = loadState(old);
    expect(t.ledger.life).toEqual({});
    expect(t.rules).toEqual([]);
    expect(t.gameIndex).toBe(5);
  });
});
