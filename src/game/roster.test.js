import { describe, it, expect } from "vitest";
import { blankState, found, tick, toSave, loadState, allPlayers, makeTrade, signRookie, closeDraft, ledgerNet } from "./franchise.js";
import { validateSave } from "./save.js";
import { teamPayroll } from "./salary.js";
import { SALARY, LEAGUE } from "./constants.js";
import { ovr } from "./gear.js";
import { slotOf } from "./roster.js";
import { newGame, stepAtBat } from "./engine.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); s.unlocked = null; return s; };

describe("pitching staffs", () => {
  it("every club has a 5-man rotation, a setup man and a closer", () => {
    const s = fresh();
    expect(s.roster.rotation).toHaveLength(5);
    expect(s.roster.pen.map((p) => p.pos)).toEqual(["RP", "CL"]);
    expect(allPlayers(s)).toHaveLength(16);
    for (const r of s.rivals) { expect(r.rotation).toHaveLength(5); expect(r.pen).toHaveLength(2); }
    expect(slotOf(s.roster, s.roster.rotation[2].id)).toBe("SP3");
    expect(slotOf(s.roster, s.roster.pen[1].id)).toBe("Closer");
    expect(teamPayroll(s.roster)).toBeLessThan(SALARY.cap * 0.3);
  });

  it("starters take turns over a season and nobody throws 600 strikeouts", () => {
    const s = fresh();
    while (s.gameIndex < LEAGUE.seasonGames) tick(s, "max");
    const starts = s.roster.rotation.map((p) => (s.gameLog[p.id] ? s.seasonStats[p.id].g : 0));
    const ks = [...s.roster.rotation, ...s.roster.pen].map((p) => s.seasonStats[p.id]?.kP || 0);
    expect(Math.max(...ks)).toBeLessThan(260);
    for (const p of s.roster.rotation) expect(s.seasonStats[p.id].g).toBeGreaterThanOrEqual(28);
    expect(s.seasonStats[s.roster.pen[0].id].g).toBeGreaterThan(100);
    expect(starts.length).toBe(5);
  });

  it("the closer comes in for a save in the 9th", () => {
    const s = fresh();
    const opp = s.rivals[0];
    const g = newGame(opp, true, 1);
    g.inning = 9; g.half = "top"; g.us = 4; g.them = 2;
    const ctx = { batters: s.roster.batters, opp, staff: { sp: s.roster.rotation[0], setup: s.roster.pen[0], closer: s.roster.pen[1] },
      oppStaff: { sp: opp.rotation[0], setup: opp.pen[0], closer: opp.pen[1] }, fence: { corner: 330, center: 400 }, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: "Suns" };
    const ev = [];
    stepAtBat(g, ctx, ev);
    expect(g.arm.us.stage).toBe("closer");
    expect(ev.some((e) => /Save situation/.test(e.text))).toBe(true);
  });

  it("trades swap matching slots; an SP rookie replaces the weakest starter", () => {
    const s = fresh();
    s.money = 1e6;
    const sp3 = s.roster.rotation[2];
    const theirs = s.rivals[0].rotation[2];
    expect(makeTrade(s, sp3.id, 0)).toBe(true);
    expect(s.roster.rotation[2].id).toBe(theirs.id);
    expect(s.rivals[0].rotation[2].id).toBe(sp3.id);
    // draft
    s.phase = "draft";
    const weakest = [...s.roster.rotation].sort((a, b) => ovr(a) - ovr(b))[0];
    s.draftClass = [{ id: 999999, name: "Rook Ie", pos: "SP", role: "SP", stuff: 50, control: 50, stamina: 50, defense: 50, signCost: 100, pot: {} }];
    expect(signRookie(s, 999999)).toBe(true);
    expect(s.roster.rotation.some((p) => p.id === weakest.id)).toBe(false);
    expect(s.roster.rotation.some((p) => p.id === 999999)).toBe(true);
    closeDraft(s);
    expect(s.phase).toBe("regular");
  });

  it("migrates a one-starter save to a full staff, keeping ids and stats", () => {
    const s = fresh();
    for (let i = 0; i < 5; i++) tick(s, "max");
    const old = toSave(s);
    const [sp, , , , , ] = old.roster.rotation;
    old.roster.sp = sp; old.roster.rp = old.roster.pen[0];
    delete old.roster.rotation; delete old.roster.pen;
    old.rivals.forEach((r) => { r.sp = r.rotation[0]; delete r.rotation; delete r.pen; });
    expect(validateSave(old)).toBe(null);
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(back.roster.rotation).toHaveLength(5);
    expect(back.roster.rotation[0].id).toBe(sp.id);
    expect(back.roster.pen).toHaveLength(2);
    expect(back.rivals.every((r) => r.rotation.length === 5 && r.pen.length === 2)).toBe(true);
    expect(back.seasonStats[sp.id]).toEqual(old.seasonStats[sp.id]);
    expect(back.log[0].text).toMatch(/pitching staff/);
    for (let i = 0; i < 3; i++) tick(back, "max");
    expect(validateSave(toSave(back))).toBe(null);
  });
});
