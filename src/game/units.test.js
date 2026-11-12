import { describe, it, expect } from "vitest";
import { blankState, found, toSave, loadState, closeDraft } from "./franchise.js";
import { unitRatings, unitReport, weakestLink, depthChart, UNITS } from "./units.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };
const bare = (p) => { const q = { ...p }; delete q.gear; delete q.trait; return q; };

describe("team report", () => {
  it("each unit answers to its own stats", () => {
    const s = fresh();
    const r = { ...s.roster, batters: s.roster.batters.map(bare), rotation: s.roster.rotation.map(bare), pen: s.roster.pen.map(bare) };
    const base = unitRatings(r);
    const pow = unitRatings({ ...r, batters: r.batters.map((p) => ({ ...p, power: p.power + 9 })) });
    expect(pow.power - base.power).toBeCloseTo(9, 5);
    for (const k of ["hit", "field", "rotation", "pen"]) expect(pow[k]).toBeCloseTo(base[k], 9);
    const rot = unitRatings({ ...r, rotation: r.rotation.map((p) => ({ ...p, stuff: p.stuff + 6 })) });
    expect(rot.rotation - base.rotation).toBeCloseTo(2, 5);
    for (const k of ["hit", "power", "field", "pen"]) expect(rot[k]).toBeCloseTo(base[k], 9);
    const pen = unitRatings({ ...r, pen: r.pen.map((p) => ({ ...p, control: p.control + 3 })) });
    expect(pen.pen - base.pen).toBeCloseTo(1, 5);
    expect(pen.rotation).toBeCloseTo(base.rotation, 9);
  });

  it("ranks run 1 to 8 and gaps are measured from the league average", () => {
    const s = fresh();
    const rep = unitReport(s);
    expect(rep.map((u) => u.id)).toEqual(UNITS.map((u) => u.id));
    for (const u of rep) {
      expect(u.rank).toBeGreaterThanOrEqual(1);
      expect(u.rank).toBeLessThanOrEqual(8);
      expect(u.of).toBe(8);
      expect(u.gap).toBeCloseTo(u.rating - u.avg, 9);
      expect(u.best).toBeGreaterThanOrEqual(u.rating);
      expect(u.weakest.name).toBeTruthy();
    }
    // the best club in a unit ranks first
    s.roster = { ...s.roster, batters: s.roster.batters.map((p) => ({ ...bare(p), power: 99 })) };
    const top = unitReport(s).find((u) => u.id === "power");
    expect(top.rank).toBe(1);
    expect(top.bestClub).toBeNull();
  });

  it("the weakest link is the unit furthest below the league, and names a player in it", () => {
    const s = fresh();
    s.roster = { ...s.roster, pen: s.roster.pen.map((p) => ({ ...bare(p), stuff: 36, control: 36, stamina: 36 })) };
    const w = weakestLink(s);
    expect(w.worst.id).toBe("pen");
    expect(w.worst.rank).toBe(8);
    expect(w.text).toMatch(/Bullpen is 8th of 8/);
    expect(s.roster.pen.some((p) => w.text.includes(p.name))).toBe(true);
    expect(w.short).toMatch(/Weakest: Bullpen \(8th\)/);
  });

  it("the depth chart covers all 16 slots", () => {
    const s = fresh();
    const d = depthChart(s);
    expect(d).toHaveLength(16);
    expect(d.map((r) => r.slot).slice(9)).toEqual(["SP1", "SP2", "SP3", "SP4", "SP5", "Setup", "Closer"]);
    for (const r of d) { expect(r.rank).toBeGreaterThanOrEqual(1); expect(r.rank).toBeLessThanOrEqual(8); expect(r.of).toBe(8); }
  });

  it("snapshots the units at opening day and keeps them through saves", () => {
    const s = fresh();
    expect(s.unitsStart).toMatchObject({ y: 1, ...unitRatings(s.roster) });
    s.roster = { ...s.roster, batters: s.roster.batters.map((p) => ({ ...p, power: Math.min(99, p.power + 5) })) };
    expect(unitReport(s).find((u) => u.id === "power").start).toBeLessThan(unitRatings(s.roster).power);
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.unitsStart).toEqual(s.unitsStart);
    const old = toSave(s); delete old.unitsStart;
    expect(loadState(JSON.parse(JSON.stringify(old))).unitsStart).toMatchObject({ late: true, y: 1 });
    s.phase = "draft"; s.year = 2; closeDraft(s);
    expect(s.unitsStart.y).toBe(2);
    expect(s.unitsStart.power).toBeCloseTo(unitRatings(s.roster).power, 9);
  });
});
