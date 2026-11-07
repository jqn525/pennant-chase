import { describe, it, expect } from "vitest";
import { blankState, found, tick, ledgerNet, toSave, loadState, allPlayers } from "./franchise.js";
import { ovr } from "./gear.js";
import { options } from "./advisor.js";
import { earnAllowance, runAutoDev, afterGame, setAutoDev, operatingResult, ALLOWANCE_GAMES } from "./autodev.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); return s; };
const teamOvr = (s) => allPlayers(s).reduce((t, p) => t + ovr(p), 0);

describe("auto-develop", () => {
  it("is on by default and only ever buys training or gear", () => {
    const s = fresh();
    expect(s.autoDev).toMatchObject({ on: true, share: 0.4 });
    s.money = 1e6; s.fans = 200000; s.autoDev.allowance = 1e6; s.autoDev.reserve = 0;
    expect(options(s).some((o) => (o.kind === "Build" || o.kind === "Print") && o.affordable)).toBe(true);
    const lvl = { merch: s.merch, tv: s.tv, stadium: { ...s.stadium } };
    const tiers = allPlayers(s).map((p) => p.cardTier || 0);
    const before = teamOvr(s);
    const out = runAutoDev(s);
    expect(out.spent).toBeGreaterThan(0);
    expect(teamOvr(s)).toBeGreaterThan(before);
    expect({ merch: s.merch, tv: s.tv, stadium: s.stadium }).toEqual(lvl);
    expect(allPlayers(s).map((p) => p.cardTier || 0)).toEqual(tiers);
    expect(s.hist.spend.every((e) => e.cat === "training" || e.cat === "gear")).toBe(true);
    expect(s.hist.spend.every((e) => e.auto)).toBe(true);
    expect(s.log[0].text).toMatch(/^Auto-develop/);
  });

  it("respects the allowance and the reserve, best payback first", () => {
    const s = fresh();
    s.money = 5000; s.autoDev.allowance = 300; s.autoDev.reserve = 0;
    const first = options(s).find((o) => (o.kind === "Train" || o.kind === "Gear") && o.affordable && o.gainPerGame > 0 && o.cost <= 300);
    const out = runAutoDev(s);
    expect(out.spent).toBeLessThanOrEqual(300);
    expect(s.hist.spend[0].pid).toBe(first.action.pid);
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
    const start = s.money;
    for (let i = 0; i < 20; i++) { tick(s, "max"); afterGame(s); }
    expect(s.hist.spend.length).toBe(0);
    setAutoDev(s, { on: true, reserve: 0 });
    for (let i = 0; i < 40; i++) { tick(s, "max"); afterGame(s); }
    expect(s.hist.spend.length).toBeGreaterThan(0);
    expect(s.money).toBeCloseTo(start + ledgerNet(s.ledger.life), 6);
  });

  it("migrates old saves: a reserve rule carries over, rules are dropped", () => {
    const s = fresh();
    const old = toSave(s);
    delete old.autoDev;
    old.rules = [{ type: "reserve", n: 2500 }, { type: "auto", payback: 30 }];
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(back.autoDev).toMatchObject({ on: true, reserve: 2500 });
    expect(back.rules).toBeUndefined();
    const again = loadState(JSON.parse(JSON.stringify(toSave(back))));
    expect(again.autoDev.reserve).toBe(2500);
  });
});
