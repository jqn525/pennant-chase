import { describe, it, expect } from "vitest";
import { TIERS, drawTier, rollTalent, ageOneYear, retireChance, MAX_RATING } from "./talent.js";
import { blankState, found, tick, closeDraft, toSave, loadState, trainCeil, allPlayers } from "./franchise.js";
import { everyone } from "./roster.js";
import { ovr } from "./gear.js";
import { newGame, playGameInstant } from "./engine.js";
import { genRoster } from "./generators.js";
import { FENCE } from "./franchise.js";
import { LEAGUE } from "./constants.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };

describe("talent", () => {
  it("most players are regulars; stars are rare", () => {
    const n = 20000, count = {};
    for (let i = 0; i < n; i++) { const t = drawTier(); count[t.id] = (count[t.id] || 0) + 1; }
    for (const t of TIERS) expect(count[t.id] / n).toBeCloseTo(t.w / 100, 1);
  });

  it("young players have room to grow; veterans are past their peak", () => {
    const young = rollTalent("bat", { tier: TIERS[3], age: 21 });
    const vet = rollTalent("bat", { tier: TIERS[3], age: 35 });
    const room = (p) => ["contact", "power", "eye", "speed", "defense"].reduce((t, k) => t + p.pot[k] - p[k], 0);
    expect(room(young)).toBeGreaterThan(20);
    expect(room(vet)).toBe(0);
  });

  it("careers rise, hold and fall; legs go first", () => {
    const base = { role: "bat", contact: 70, power: 70, eye: 70, speed: 70, defense: 70, pot: { contact: 80, power: 80, eye: 80, speed: 80, defense: 80 } };
    let up = 0, down = 0, speedDrop = 0, eyeDrop = 0;
    for (let i = 0; i < 300; i++) {
      const y = ageOneYear({ ...base, age: 22 });
      up += ovr(y) - 70;
      const o = ageOneYear({ ...base, age: 34 });
      down += 70 - ovr(o); speedDrop += 70 - o.speed; eyeDrop += 70 - o.eye;
    }
    expect(up / 300).toBeGreaterThan(1.5);
    expect(down / 300).toBeGreaterThan(1.5);
    expect(speedDrop).toBeGreaterThan(eyeDrop);
    expect(retireChance({ age: 40 }, 80)).toBe(1);
    expect(retireChance({ age: 28 }, 50)).toBe(0);
  });

  it("starting rosters mix rookies, prime players and veterans", () => {
    const ages = [];
    for (let i = 0; i < 20; i++) ages.push(...everyone(genRoster(65)).map((p) => p.age));
    expect(ages.some((a) => a <= 24)).toBe(true);
    expect(ages.filter((a) => a >= 25 && a <= 31).length / ages.length).toBeGreaterThan(0.4);
    expect(ages.some((a) => a >= 32)).toBe(true);
  });

  it("training stops at a player's own ceiling (franchise tag adds 4)", () => {
    const s = fresh();
    const p = s.roster.batters[0];
    expect(trainCeil(s, p, "power")).toBe(Math.min(MAX_RATING, p.pot.power));
    expect(trainCeil(s, { ...p, franchise: true }, "power")).toBe(Math.min(MAX_RATING, p.pot.power + 4));
  });

  it("nobody plays forever: after many winters the roster is full and nobody is over 40", () => {
    const s = fresh();
    const starting = new Set(allPlayers(s).map((p) => p.id));
    let retiredNews = false;
    for (let y = 0; y < 12; y++) {
      for (let i = 0; i < 400 && s.phase !== "draft"; i++) tick(s, "max");
      retiredNews = retiredNews || s.log.some((e) => /retires after/.test(e.text));
      s.yearEnd = null; closeDraft(s);
    }
    const now = allPlayers(s);
    expect(now).toHaveLength(16);
    expect(Math.max(...now.map((p) => p.age))).toBeLessThanOrEqual(40);
    expect(now.filter((p) => starting.has(p.id)).length).toBeLessThan(8);
    expect(retiredNews).toBe(true);
  }, 120000);

  it("old saves get ages and ceilings without anyone losing ratings", () => {
    const s = fresh();
    const old = toSave(s);
    for (const p of everyone(old.roster)) { delete p.age; delete p.years; p.pot = undefined; }
    const before = everyone(old.roster).map(ovr);
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(everyone(back.roster).map(ovr)).toEqual(before);
    expect(everyone(back.roster).every((p) => p.age >= 21 && p.pot)).toBe(true);
  });
});

describe("engine", () => {
  it("equal clubs score about the same at any rating level", () => {
    const set = (p, keys, v) => { for (const k of keys) p[k] = v; delete p.gear; delete p.trait; return p; };
    const rpg = (L) => {
      const us = genRoster(65), them = genRoster(65);
      for (const r of [us, them]) { r.batters.forEach((p) => set(p, ["contact", "power", "eye", "speed", "defense"], L)); [...r.rotation, ...r.pen].forEach((p) => set(p, ["stuff", "control", "stamina", "defense"], L)); }
      const opp = { name: "T", ...them };
      let runs = 0;
      for (let i = 0; i < 600; i++) {
        const g = newGame(opp, i % 2 === 0, 1);
        playGameInstant(g, { batters: us.batters, opp, staff: { sp: us.rotation[0], setup: us.pen[0], closer: us.pen[1] }, oppStaff: { sp: them.rotation[0], setup: them.pen[0], closer: them.pen[1] }, fence: FENCE, statBase: LEAGUE.statBase, innings: 9, cityName: "U" });
        runs += g.us + g.them;
      }
      return runs / 1200;
    };
    const lo = rpg(55), hi = rpg(90);
    expect(Math.abs(lo - hi) / lo).toBeLessThan(0.2);
    expect(hi).toBeLessThan(6);
  });
});
