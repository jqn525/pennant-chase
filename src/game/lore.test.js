import { describe, it, expect } from "vitest";
import { blankState, found, toSave, loadState, allPlayers, LORE } from "./franchise.js";
import { startBuild } from "./construction.js";
import { CITY_POOL, NICKNAME_POOL } from "./constants.js";
import { everyone } from "./roster.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };

describe("the Orbital League rename", () => {
  it("renames builds, gear and rivals in an old save; your club and the numbers stay", () => {
    const s = blankState(); found(s, club); s.unlocked = null; s.fans = 5000; s.money = 10000;
    startBuild(s, "conc");
    const p = s.roster.batters[0];
    p.gear = { bat: { id: "bat-abc1234", slot: "bat", rarity: 2, name: "Ash Hammer", boosts: { power: 5 }, cost: 1500 } };
    const old = JSON.parse(JSON.stringify(toSave(s)));
    delete old.lore;
    old.builds.conc.name = "Hot Dog Cart";
    old.rivals.forEach((t) => { t.name = "Mudhens"; t.tCity = "Toledo"; });
    const ratings = everyone(old.roster).map((q) => q.power);
    const back = loadState(old);
    expect(back.lore).toBe(LORE);
    expect(back.builds.conc.name).toBe("Ration Cart");
    const g = allPlayers(back).find((q) => q.id === p.id).gear.bat;
    expect(g.name).not.toBe("Ash Hammer");
    expect(g.boosts).toEqual({ power: 5 });
    expect(back.rivals.every((t) => CITY_POOL.includes(t.tCity) && NICKNAME_POOL.includes(t.name))).toBe(true);
    expect(new Set(back.rivals.map((t) => t.name)).size).toBe(7);
    expect(back.city).toMatchObject({ name: "Vancouver", nickname: "Suns" });
    expect(everyone(back.roster).map((q) => q.power)).toEqual(ratings);
    expect(back.money).toBe(old.money);
    // runs once: a second load keeps the names it gave
    const again = loadState(JSON.parse(JSON.stringify(toSave(back))));
    expect(again.rivals.map((t) => t.name)).toEqual(back.rivals.map((t) => t.name));
  });
});
