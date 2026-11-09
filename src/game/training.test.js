import { describe, it, expect } from "vitest";
import { blankState, found, toSave, loadState, allPlayers, closeDraft, tick } from "./franchise.js";
import { TRAINING, MARKETS } from "./constants.js";
import {
  startProgram, startLock, progressTraining, gamesFor, assignLane, hireLane, cancelProgram,
  rustTick, areaOf, rivalTraining, rivalLaneAreas,
} from "./training.js";
import { makeRivals, teamRating, assignMarkets } from "./season.js";
import { everyone } from "./roster.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; s.money = 1e6; return s; };
const roomy = (s, role, key) => {
  const p = allPlayers(s).find((x) => (role === "bat") === (x.role === "bat"));
  p.pot = { ...p.pot, [key]: p[key] + 10 };
  return p;
};

describe("coaching lanes", () => {
  it("one program per lane; a busy area says when it frees up", () => {
    const s = fresh();
    const a = roomy(s, "bat", "contact"), b = s.roster.batters.find((x) => x.id !== a.id);
    b.pot = { ...b.pot, power: b.power + 10 };
    expect(startProgram(s, a.id, "contact")).toBe(true);
    expect(startLock(s, a.id, "contact")).toMatch(/Already/);
    expect(startLock(s, b.id, "power")).toMatch(/busy \(free in \d+ game/);
    expect(startProgram(s, b.id, "power")).toBe(false);
    // the field lane is separate
    expect(startProgram(s, b.id, "speed") || b.speed >= b.pot.speed).toBe(true);
  });

  it("takes games, is paid each game, then the point lands", () => {
    const s = fresh();
    const p = roomy(s, "bat", "contact");
    const from = p.contact, games = gamesFor(s, p, "contact");
    const start = s.money;
    startProgram(s, p.id, "contact");
    expect(s.money).toBe(start);
    for (let i = 0; i < games - 1; i++) progressTraining(s);
    expect(allPlayers(s).find((x) => x.id === p.id).contact).toBe(from);
    progressTraining(s);
    expect(allPlayers(s).find((x) => x.id === p.id).contact).toBe(from + 1);
    expect(s.money).toBeLessThan(start);
    expect(s.hist.spend.at(-1)).toMatchObject({ cat: "training", pid: p.id });
  });

  it("higher ratings and the last points before a ceiling take longer", () => {
    const s = fresh();
    const p = { role: "bat", contact: 55, pot: { contact: 90 } };
    expect(gamesFor(s, p, "contact")).toBeLessThan(gamesFor(s, { ...p, contact: 80 }, "contact"));
    expect(gamesFor(s, { ...p, contact: 88 }, "contact")).toBe(gamesFor(s, { ...p, contact: 85, pot: { contact: 99 } }, "contact") + TRAINING.near);
  });

  it("stalls without cash, pauses in winter, can be cancelled", () => {
    const s = fresh();
    const p = roomy(s, "bat", "contact");
    startProgram(s, p.id, "contact");
    s.money = 0;
    progressTraining(s);
    expect(s.training.lanes[0].prog).toMatchObject({ stalled: true });
    s.phase = "draft";
    expect(startLock(s, p.id, "power")).toMatch(/Winter/);
    s.phase = "regular";
    expect(cancelProgram(s, 0)).toBe(true);
    expect(s.training.lanes[0].prog).toBeNull();
  });

  it("lanes move between coaches only when idle; neglected areas rust", () => {
    const s = fresh();
    const p = roomy(s, "bat", "contact");
    startProgram(s, p.id, "contact");
    expect(assignLane(s, 0, "pitch")).toBe(false);
    expect(assignLane(s, 2, "hit")).toBe(true); // field loses its lane
    const total = () => allPlayers(s).reduce((t, q) => t + (q.role === "bat" ? q.speed : 0) + q.defense, 0);
    const before = total();
    for (let i = 0; i < TRAINING.rustAfter * 3; i++) rustTick(s);
    expect(before - total()).toBe(3);
    expect(s.log.some((e) => /Rust:/.test(e.text))).toBe(true);
    // no more than rustMax a season for any one player
    for (let i = 0; i < TRAINING.rustAfter * 200; i++) rustTick(s);
    expect(allPlayers(s).every((q) => !q.rust || q.rust.n <= TRAINING.rustMax)).toBe(true);
  });

  it("assistant coaches open lanes for a fee and a wage", () => {
    const s = fresh();
    const start = s.money;
    expect(hireLane(s, "pitch")).toBe(true);
    expect(s.training.lanes).toHaveLength(4);
    expect(start - s.money).toBe(TRAINING.hire[0].fee);
    const m = s.money;
    progressTraining(s);
    expect(m - s.money).toBe(TRAINING.hire[0].wage);
    expect(s.ledger.life.coaching).toBeLessThan(0);
    hireLane(s); hireLane(s);
    expect(hireLane(s)).toBe(false);
    expect(s.training.lanes).toHaveLength(TRAINING.maxLanes);
  });

  it("maps stats to coaches", () => {
    expect(areaOf({ role: "bat" }, "power")).toBe("hit");
    expect(areaOf({ role: "sp" }, "stuff")).toBe("pitch");
    expect(areaOf({ role: "sp" }, "defense")).toBe("field");
    expect(areaOf({ role: "bat" }, "speed")).toBe("field");
  });

  it("saves, reloads, and old saves get three lanes", () => {
    const s = fresh();
    const p = roomy(s, "bat", "contact");
    startProgram(s, p.id, "contact");
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.training.lanes[0].prog).toMatchObject({ pid: p.id });
    const old = toSave(s); delete old.training;
    expect(loadState(JSON.parse(JSON.stringify(old))).training.lanes.map((l) => l.area)).toEqual(["hit", "pitch", "field"]);
  });
});

describe("rival markets", () => {
  it("one or two powerhouses, two small markets; powerhouses start stronger", () => {
    let gap = 0;
    for (let i = 0; i < 20; i++) {
      const r = makeRivals();
      const n = (m) => r.filter((t) => t.market === m).length;
      expect(n("power")).toBeGreaterThanOrEqual(1);
      expect(n("power")).toBeLessThanOrEqual(2);
      expect(n("small")).toBe(2);
      const avg = (m) => r.filter((t) => t.market === m).reduce((x, t) => x + teamRating(t), 0) / n(m);
      gap += avg("power") - avg("small");
    }
    expect(gap / 20).toBeGreaterThan(4);
  });

  it("rivals train in lanes sized by market", () => {
    const r = makeRivals();
    const big = r.find((t) => t.market === "power"), small = r.find((t) => t.market === "small");
    expect(rivalLaneAreas(big)).toHaveLength(MARKETS.power.lanes);
    expect(rivalLaneAreas(small)).toHaveLength(MARKETS.small.lanes);
    const sum = (t) => everyone(t).reduce((n, p) => n + ["contact", "power", "eye", "speed", "defense", "stuff", "control", "stamina"].reduce((x, k) => x + (p[k] || 0), 0), 0);
    const before = sum(big);
    const after = rivalTraining(big, 30);
    expect(sum(after) - before).toBeGreaterThan(5);
    expect(after.lanes).toHaveLength(MARKETS.power.lanes);
    expect(after.market).toBe("power");
  });

  it("your club starts in the lower half", () => {
    let below = 0;
    for (let i = 0; i < 10; i++) {
      const s = blankState(); found(s, club);
      const r = s.rivals.map(teamRating).sort((a, b) => a - b);
      if (teamRating(s.roster) <= r[3]) below++;
    }
    expect(below).toBeGreaterThanOrEqual(9);
  });

  it("old saves get markets by strength", () => {
    const r = makeRivals().map(({ market, ...t }) => t);
    const m = assignMarkets(r);
    expect(m.filter((t) => t.market === "power")).toHaveLength(1);
    expect(m.filter((t) => t.market === "small")).toHaveLength(2);
  });

  it("a season with lanes keeps the league moving but sane", () => {
    const s = blankState(); found(s, club); s.unlocked = null;
    for (let i = 0; i < 4000 && s.phase !== "draft"; i++) tick(s, "max");
    const r = s.rivals.map(teamRating);
    expect(Math.max(...r)).toBeLessThan(85);
    expect(s.rivals.every((t) => Array.isArray(t.lanes))).toBe(true);
    s.yearEnd = null; closeDraft(s);
    expect(s.rivals.every((t) => t.market)).toBe(true);
  }, 60000);
});
