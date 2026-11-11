import { describe, it, expect } from "vitest";
import { blankState, found, toSave, loadState, allPlayers } from "./franchise.js";
import { startBuild } from "./construction.js";
import { CITY_POOL, NICKNAME_POOL } from "./constants.js";
import { everyone } from "./roster.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };

describe("saves from the Orbital reskin", () => {
  it("get baseball names back; your club and the numbers stay", () => {
    const s = blankState(); found(s, club); s.unlocked = null; s.fans = 5000; s.money = 10000;
    startBuild(s, "conc");
    const p = s.roster.batters[0];
    p.gear = { bat: { id: "bat-abc1234", slot: "bat", rarity: 2, name: "Railgun Driver", boosts: { power: 5 }, cost: 1500 } };
    const old = JSON.parse(JSON.stringify(toSave(s)));
    old.lore = 1;
    old.builds.conc.name = "Ration Cart";
    old.rivals.forEach((t) => { t.name = "Comets"; t.tCity = "Ceres"; });
    const ratings = everyone(old.roster).map((q) => q.power);
    const back = loadState(old);
    expect(back.lore).toBeUndefined();
    expect(back.builds.conc.name).toBe("Hot Dog Cart");
    const g = allPlayers(back).find((q) => q.id === p.id).gear.bat;
    expect(g.name).not.toBe("Railgun Driver");
    expect(g.boosts).toEqual({ power: 5 });
    expect(back.rivals.every((t) => CITY_POOL.includes(t.tCity) && NICKNAME_POOL.includes(t.name))).toBe(true);
    expect(back.city).toMatchObject({ name: "Vancouver", nickname: "Suns" });
    expect(everyone(back.roster).map((q) => q.power)).toEqual(ratings);
    // runs once
    const again = loadState(JSON.parse(JSON.stringify(toSave(back))));
    expect(again.rivals.map((t) => t.name)).toEqual(back.rivals.map((t) => t.name));
  });
});
