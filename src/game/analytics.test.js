import { describe, it, expect } from "vitest";
import { blankState, found, tick, buyGear, allPlayers, ledgerNet, toSave, loadState, careerOf } from "./franchise.js";
import { startProgram, progressTraining } from "./training.js";
const finish = (s) => { for (let i = 0; i < 40 && s.training.lanes.some((l) => l.prog); i++) progressTraining(s); };

import { spendReport, development, teamKpis, project, pythag, paceProjection, milestones, careerLeaders } from "./analytics.js";
import { seasonRows, SPEND_CATS, field } from "./history.js";
import { LEAGUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };
function playSeason(s) { const y = s.year; for (let i = 0; i < 400 && !(s.phase === "draft" && s.year > y); i++) tick(s, "max"); }
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

describe("history", () => {
  it("writes a row per game, books every purchase, and tracks overall", () => {
    const s = fresh();
    for (let i = 0; i < 10; i++) tick(s, "max");
    expect(s.hist.games.length).toBe(10);
    expect(field(s.hist.games[9], "n")).toBe(10);
    s.money = 50000;
    const p = s.roster.batters[0];
    p.pot = { ...p.pot, contact: p.contact + 10 };
    const before = s.hist.ovr[p.id].length;
    expect(startProgram(s, p.id, "contact")).toBe(true);
    finish(s);
    const item = s.shopItems.find((i) => i.slot !== "glove" || true);
    const target = allPlayers(s).find((x) => (x.role === "bat") === ["bat", "cleats", "batting gloves", "helmet"].some((k) => item.slot.toLowerCase().includes(k.split(" ")[0])));
    if (target) buyGear(s, target.id, item.id);
    expect(s.hist.ovr[p.id].length).toBeGreaterThan(before);
    const ev = s.hist.spend.find((e) => e.cat === "training");
    expect(ev).toMatchObject({ pid: p.id, cost: expect.any(Number) });
    expect(ev.d).toBeGreaterThan(0);
    for (const cat of SPEND_CATS) {
      const booked = s.hist.spend.filter((e) => e.cat === cat).reduce((t, e) => t + e.cost, 0);
      expect(booked).toBeCloseTo(-(s.ledger.life[cat] || 0), -1);
    }
  });

  it("rolls up a season, keeps records, survives saves, and stays small", () => {
    const s = fresh();
    playSeason(s);
    expect(s.hist.seasons.length).toBe(1);
    const sz = s.hist.seasons[0];
    expect(sz.w + sz.l).toBe(LEAGUE.seasonGames);
    expect(s.hist.records.game.hr || s.hist.records.game.h).toBeTruthy();
    expect(Object.keys(s.hist.records.season).length).toBeGreaterThan(0);
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.hist.games.length).toBe(s.hist.games.length);
    const old = toSave(s); delete old.hist;
    expect(loadState(JSON.parse(JSON.stringify(old))).hist.games).toEqual([]);
    for (let k = 0; k < 2; k++) { s.draftClass = null; s.phase = "regular"; playSeason(s); }
    expect(JSON.stringify(toSave(s)).length).toBeLessThan(300000);
    expect(seasonRows(s.hist, 1).length).toBeLessThan(80); // thinned
    expect(seasonRows(s.hist, 3).length).toBeGreaterThanOrEqual(LEAGUE.seasonGames);
  });
});

describe("analytics", () => {
  it("pythagorean expectation", () => {
    expect(pythag(100, 100)).toBeCloseTo(0.5);
    expect(pythag(500, 400)).toBeGreaterThan(0.55);
  });

  it("team KPIs add up and spend ROI matches spend", () => {
    const s = fresh();
    // someone with room left to grow (no trait, so a single point can't round away)
    const grow = s.roster.batters.find((p) => (p.pot?.power ?? 0) - p.power >= 3) || s.roster.batters[0];
    delete grow.trait;
    for (let i = 0; i < 30; i++) tick(s, "max");
    s.money = 20000;
    if (grow.pot) grow.pot.power = Math.max(grow.pot.power, grow.power + 5);
    expect(startProgram(s, grow.id, "power")).toBe(true);
    finish(s);
    for (let i = 0; i < 10; i++) tick(s, "max");
    const k = teamKpis(s);
    expect(k.w).toBe(s.standings[0].w);
    expect(k.home.w + k.away.w).toBe(k.w);
    expect(k.winPct.length).toBe(k.games);
    const r = spendReport(s);
    expect(r.total).toBe(r.byCat.reduce((t, c) => t + c.cost, 0));
    expect(r.ovrBought).toBeGreaterThan(0);
    expect(r.returned).toBeGreaterThan(0);
    const d = development(s).find((x) => x.p.id === grow.id);
    expect(d.invested).toBeGreaterThan(0);
    expect(d.season).toBeGreaterThan(0);
    expect(paceProjection(s).left).toBe(LEAGUE.seasonGames - s.gameIndex);
    expect(milestones(s, careerOf)).toBeInstanceOf(Array);
    expect(careerLeaders(s, careerOf)[0][1]).toBeTruthy();
  });

  it("projections: a clinched team is in, an eliminated one is out", () => {
    const s = fresh();
    for (let i = 0; i < 5; i++) tick(s, "max");
    const left = LEAGUE.seasonGames - s.gameIndex;
    s.standings = s.standings.map((t, i) => (i === 0 ? { w: 140, l: 0 } : { w: 0, l: 10 }));
    expect(project(s, 200, seeded(3)).playoffPct).toBe(1);
    s.standings = s.standings.map((t, i) => (i === 0 ? { w: 0, l: 150 - left } : { w: 140, l: 0 }));
    const p = project(s, 200, seeded(4));
    expect(p.playoffPct).toBe(0);
    expect(p.cupPct).toBe(0);
  });
});
