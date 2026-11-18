import { describe, it, expect } from "vitest";
import { blankState, found, tick, ledgerNet, toSave, loadState, allPlayers } from "./franchise.js";
import { ovr } from "./gear.js";
import { options } from "./advisor.js";
import { progressTraining } from "./training.js";
const finish = (s) => { for (let i = 0; i < 40 && s.training.lanes.some((l) => l.prog); i++) progressTraining(s); };
import { earnAllowance, runAutoDev, afterGame, setAutoDev, operatingResult, ALLOWANCE_GAMES } from "./autodev.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };
// staff start switched off; most tests want them working
const staffed = () => { const s = fresh(); s.autoDev.on = true; s.training.auto = { hit: true, pitch: true, field: true }; return s; };
const teamOvr = (s) => allPlayers(s).reduce((t, p) => t + ovr(p), 0);

describe("auto-develop", () => {
  it("starts off; switched on it only ever buys training or gear", () => {
    const s = fresh();
    expect(s.autoDev).toMatchObject({ on: false, share: 0.4 });
    expect(s.training.auto).toEqual({ hit: false, pitch: false, field: false });
    s.autoDev.on = true; s.training.auto = { hit: true, pitch: true, field: true };
    s.money = 1e6; s.fans = 200000; s.autoDev.allowance = 1e6; s.autoDev.reserve = 0;
    expect(options(s).some((o) => (o.kind === "Build" || o.kind === "Promote") && o.affordable)).toBe(true);
    const lvl = { merch: s.merch, tv: s.tv, stadium: { ...s.stadium } };
    const tiers = allPlayers(s).map((p) => p.cardTier || 0);
    const before = teamOvr(s);
    const out = runAutoDev(s);
    expect(out.spent).toBeGreaterThan(0);
    expect(out.points).toBe(3); // one program per coach lane
    expect(s.training.lanes.every((l) => l.prog?.auto)).toBe(true);
    finish(s);
    expect(teamOvr(s)).toBeGreaterThan(before);
    expect({ merch: s.merch, tv: s.tv, stadium: s.stadium }).toEqual(lvl);
    expect(allPlayers(s).map((p) => p.cardTier || 0)).toEqual(tiers);
    expect(s.hist.spend.every((e) => e.cat === "training" || e.cat === "gear")).toBe(true);
    expect(s.hist.spend.every((e) => e.auto)).toBe(true);
    expect(s.log[0].text).toMatch(/^Staff on auto/);
  });

  it("respects the allowance and the reserve, best payback first", () => {
    const s = fresh();
    s.money = 5000; s.autoDev.allowance = 300; s.autoDev.reserve = 0;
    s.training.auto = { hit: false, pitch: false, field: false }; // coaches run on lanes, not the allowance
    const out = runAutoDev(s);
    expect(out.spent).toBeLessThanOrEqual(300);
    const t = fresh();
    t.money = 1000; t.autoDev.allowance = 1e6; t.autoDev.reserve = 900;
    runAutoDev(t);
    expect(t.money).toBeGreaterThanOrEqual(900);
  });

  it("banks a share of each game's operating result, capped", () => {
    const s = fresh();
    tick(s, "max");
    const op = operatingResult(s.ledger.game);
    expect(earnAllowance(s)).toBeCloseTo(Math.max(0, op) * 0.4, 6);
    s.ledger.game = { gate: 1000 };
    for (let i = 0; i < 200; i++) earnAllowance(s);
    expect(s.autoDev.allowance).toBeLessThanOrEqual(400 * ALLOWANCE_GAMES + 1);
  });

  it("off means no buys; the books still reconcile with it on", () => {
    const s = fresh();
    setAutoDev(s, { on: false });
    s.training.auto = { hit: false, pitch: false, field: false };
    const start = s.money;
    for (let i = 0; i < 20; i++) { tick(s, "max"); afterGame(s); }
    expect(s.hist.spend.length).toBe(0);
    setAutoDev(s, { on: true, reserve: 0 });
    s.training.auto = { hit: true, pitch: true, field: true };
    s.money += 20000; s.ledger.life.seed = 20000; // enough cash that the staff can act
    for (let i = 0; i < 40; i++) { tick(s, "max"); afterGame(s); }
    expect(s.hist.spend.length > 0 || s.training.lanes.some((l) => l.prog)).toBe(true);
    expect(s.money).toBeCloseTo(start + ledgerNet(s.ledger.life), 6);
  });

  it("migrates old saves: a reserve rule carries over, rules are dropped", () => {
    const s = fresh();
    const old = toSave(s);
    delete old.autoDev;
    old.rules = [{ type: "reserve", n: 2500 }, { type: "auto", payback: 30 }];
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(back.autoDev).toMatchObject({ reserve: 2500 });
    expect(back.rules).toBeUndefined();
    const again = loadState(JSON.parse(JSON.stringify(toSave(back))));
    expect(again.autoDev.reserve).toBe(2500);
  });

  it("coaches on auto pick at random, not the advisor's favourite", () => {
    const picks = new Set();
    for (let i = 0; i < 30; i++) {
      const s = staffed();
      s.money = 1e5; s.autoDev.reserve = 0; s.autoDev.on = false;
      runAutoDev(s, { log: false });
      for (const l of s.training.lanes) if (l.prog) picks.add(`${l.prog.pid}-${l.prog.key}`);
    }
    expect(picks.size).toBeGreaterThan(20);
  });

  it("the equipment manager buys a random piece only now and then", () => {
    let bought = 0, games = 0;
    for (let i = 0; i < 40; i++) {
      const s = staffed();
      s.money = 1e5; s.autoDev.reserve = 0; s.autoDev.allowance = 1e5;
      s.training.auto = { hit: false, pitch: false, field: false };
      const n = s.hist.spend.length;
      runAutoDev(s, { log: false });
      games++;
      bought += s.hist.spend.length > n ? 1 : 0;
      expect(s.hist.spend.slice(n).length).toBeLessThanOrEqual(1);
    }
    expect(bought).toBeGreaterThan(3);
    expect(bought).toBeLessThan(games * 0.7);
  });
});
