import { describe, it, expect } from "vitest";
import { blankState, found, tick, ledgerNet } from "./franchise.js";
import { options, apply, valueOfWin, gearGain } from "./advisor.js";
import { ticketGate } from "./engine.js";
import { stadiumFx, ECON } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "train", label: "DEV ACADEMY" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; for (let i = 0; i < 20; i++) tick(s, "max"); return s; };

describe("advisor", () => {
  it("lists train, gear, build and is sorted by payback", () => {
    const s = fresh();
    s.money = 50000;
    const o = options(s);
    for (const k of ["Train", "Gear", "Build"]) expect(o.some((x) => x.kind === k)).toBe(true);
    const buyable = o.filter((x) => x.affordable && Number.isFinite(x.payback));
    for (let i = 1; i < buyable.length; i++) expect(buyable[i].payback).toBeGreaterThanOrEqual(buyable[i - 1].payback);
  });

  it("values seats at zero until the fan base outgrows the seat cap", () => {
    const s = fresh();
    s.fans = 6000; s.stadium = { ...s.stadium, seats: 0 }; s.money = 50000;
    const seats = options(s).find((x) => x.id === "build-seats");
    expect(seats.gainPerGame).toBeLessThan(1);
    expect(seats.payback).toBe(Infinity);
    s.fans = 12000;
    expect(options(s).find((x) => x.id === "build-seats").gainPerGame).toBeGreaterThan(1);
  });

  it("values parking at the real ticket-gate difference", () => {
    const s = fresh();
    s.fans = 5000; s.money = 50000;
    const park = options(s).find((x) => x.id === "build-parking");
    const g = (st) => ticketGate({ fans: s.fans, formWins: s.form.filter((f) => f === "W").length, ...stadiumFx(st), gateBonus: false }).gate;
    expect(park.gainPerGame).toBeCloseTo(g({ ...s.stadium, parking: 1 }) - g(s.stadium), 4);
    expect(park.payback).toBeCloseTo(park.cost / park.gainPerGame, 6);
  });

  it("locks what you can't have yet and says why", () => {
    const s = fresh();
    s.money = 100;
    const o = options(s);
    expect(o.find((x) => x.id === "build-seats").lock).toMatch(/fans/);
    expect(o.filter((x) => x.cost > 100).every((x) => x.lock)).toBe(true);
  });

  it("applies an option and books it in the ledger", () => {
    const s = fresh();
    s.money = 50000;
    const start = s.money, life = ledgerNet(s.ledger.life);
    const top = options(s).find((x) => x.affordable);
    expect(apply(s, top)).toBe(true);
    expect(s.money).toBeCloseTo(start - top.cost, 6);
    expect(ledgerNet(s.ledger.life) - life).toBeCloseTo(-top.cost, 6);
  });

  it("prices a win and gear sensibly", () => {
    const s = fresh();
    expect(valueOfWin(s)).toBeGreaterThan((ECON.gateWinBase - ECON.gateLossBase));
    const p = s.roster.batters[0];
    expect(gearGain(p, { slot: "bat", boosts: { power: 10 } })).toBeGreaterThan(0);
  });
});
