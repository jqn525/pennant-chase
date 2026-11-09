import { startProgram } from "./training.js";
import { describe, it, expect } from "vitest";
import { blankState, found, tick, ledgerNet, toSave, loadState, buyGear, printCard, makeTrade, signRookie, merchTick, merchPerGame, build, allPlayers } from "./franchise.js";
import { options, apply } from "./advisor.js";
import { startBuild, cancelBuild, startLock, installments } from "./construction.js";
import { ticketGate } from "./engine.js";
import { LEAGUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };
function playSeason(s) { const y = s.year; for (let i = 0; i < 400 && !(s.phase === "draft" && s.year > y); i++) tick(s, "max"); }

describe("construction", () => {
  it("starts free, pays per game, opens after N paid games", () => {
    const s = fresh();
    s.fans = 5000; s.money = 10000;
    const start = s.money;
    expect(startBuild(s, "conc")).toBe(true);
    expect(s.money).toBe(start);
    expect(startBuild(s, "conc")).toBe(false); // one project per area
    expect(startLock(s, "conc")).toMatch(/Already/);
    const b = s.builds.conc;
    expect(b.games).toBe(2);
    expect(installments(s)).toBe(b.perGame);
    tick(s, "max");
    expect(s.builds.conc.left).toBe(1);
    expect(s.stadium.conc).toBe(0);
    tick(s, "max");
    expect(s.builds.conc).toBeUndefined();
    expect(s.stadium.conc).toBe(1);
    const ev = s.hist.spend.find((e) => e.proj === "conc");
    expect(ev.cost).toBe(2000);
    expect(ev.doneN).toBe(s.hist.n);
    expect(-(s.ledger.life.upgrades || 0)).toBe(2000);
    expect(s.log.some((e) => /Hot Dog Cart opens/.test(e.text))).toBe(true);
  });

  it("stalls when cash runs short, can be cancelled, and survives a save", () => {
    const s = fresh();
    s.fans = 50000; s.money = 0;
    startBuild(s, "seats");
    s.money = 0;
    tick(s, "max");
    const b = s.builds.seats;
    expect(b.left).toBe(b.games - (b.paid ? 1 : 0));
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.builds.seats.games).toBe(b.games);
    expect(cancelBuild(s, "seats")).toBe(true);
    expect(s.builds.seats).toBeUndefined();
  });

  it("advisor builds start construction and count the wait in payback", () => {
    const s = fresh();
    s.fans = 5000; s.money = 1500;
    const o = options(s).find((x) => x.id === "build-conc");
    expect(o.affordable).toBe(true); // only the first installment is needed
    expect(o.payback).toBeCloseTo(o.cost / o.gainPerGame + o.games, 6);
    expect(apply(s, o)).toBe(true);
    expect(s.builds.conc).toBeTruthy();
    expect(options(s).some((x) => x.id === "build-conc")).toBe(false);
  });
});

describe("economy", () => {
  it("merch pays per game, the same at every speed", () => {
    const s = fresh();
    s.fans = 20000; s.money = 1e6;
    build(s, "merch");
    const a = options({ ...s, speed: 1 }).find((x) => x.id === "build-merch");
    const b = options({ ...s, speed: "max" }).find((x) => x.id === "build-merch");
    expect(a.gainPerGame).toBeCloseTo(b.gainPerGame, 6);
    const before = s.ledger.life.merch || 0;
    merchTick(s, 10);
    expect((s.ledger.life.merch || 0) - before).toBeCloseTo(merchPerGame(s) * 10, 4);
  });

  it("fans past capacity raise ticket prices, up to +60%", () => {
    const base = ticketGate({ fans: 8000, attCap: 8000, formWins: 10 });
    const more = ticketGate({ fans: 12000, attCap: 8000, formWins: 10 });
    const max = ticketGate({ fans: 100000, attCap: 8000, formWins: 10 });
    expect(more.attendance).toBe(base.attendance);
    expect(more.gate).toBeGreaterThan(base.gate);
    expect(max.gate / base.gate).toBeCloseTo(1.6, 6);
  });
});

describe("season end and winter", () => {
  it("warns at 10 left, slows MAX at 3 left, reviews the year, then locks winter", () => {
    const s = fresh();
    s.speed = "max";
    while (s.gameIndex < LEAGUE.seasonGames - 3) tick(s, "max");
    expect(s.log.some((e) => /10 games left/.test(e.text))).toBe(true);
    expect(s.speed).toBe(4);
    playSeason(s);
    expect(s.phase).toBe("draft");
    expect(s.yearEnd).toMatchObject({ y: 1, w: expect.any(Number) });
    s.money = 1e6;
    const p = s.roster.batters[0];
    expect(startProgram(s, p.id, "power")).toBe(false);
    expect(buyGear(s, p.id, s.shopItems[0].id)).toBe(false);
    expect(printCard(s, p.id)).toBe(false);
    expect(makeTrade(s, p.id, 0)).toBe(false);
    expect(startBuild(s, "parking")).toBe(false);
    expect(options(s)).toEqual([]);
    expect(signRookie(s, s.draftClass[0].id)).toBe(true);
    expect(s.money).toBeCloseTo(s.money, 0);
    expect(ledgerNet(s.ledger.life)).toBeLessThan(1e9);
  });
});
