import { describe, expect, it } from "vitest";
import { LEAGUE } from "./constants.js";
import { genRoster } from "./generators.js";
import { makeRivals, makeSchedule } from "./season.js";
import { newGame } from "./engine.js";
import { decodeBackup, encodeBackup, parseSave } from "./save.js";

const validSave = () => {
  const roster = genRoster(LEAGUE.statBase);
  const rivals = makeRivals(LEAGUE.statBase);
  const { schedule, rivalDays } = makeSchedule();
  return {
    version: 3, city: { name: "Test", nickname: "Club" }, money: 100, fans: 100,
    roster, rivals, schedule, rivalDays, gameIndex: 0, year: 1, phase: "regular",
    standings: Array.from({ length: 8 }, () => ({ w: 0, l: 0 })), playoffs: null,
    draftClass: null,
  };
};

describe("save validation", () => {
  it("accepts an older v3 save without live-game fields", () => {
    expect(parseSave(JSON.stringify(validSave())).ok).toBe(true);
  });

  it("rejects malformed roster data before restore", () => {
    const save = validSave();
    save.roster = {};
    expect(decodeBackup(encodeBackup(save))).toMatchObject({ ok: false });
  });

  it("round-trips the complete live game and its snapshot", () => {
    const save = validSave();
    const opp = save.rivals[0];
    save.liveGame = newGame(opp, true, 1);
    save.liveGame.inning = 6;
    save.liveGame.outs = 2;
    save.liveGame.bases[0] = save.roster.batters[0];
    save.liveGame.statAcc[save.roster.batters[1].id] = { ab: 1, h: 1 };
    save.liveContext = {
      ...save.roster, opp, fence: { corner: LEAGUE.fenceCorner, center: LEAGUE.fenceCenter },
      statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: "Club",
    };
    const restored = decodeBackup(encodeBackup(save));
    expect(restored.ok).toBe(true);
    expect(restored.value.liveGame).toEqual(save.liveGame);
    expect(restored.value.liveContext).toEqual(save.liveContext);
  });
});
