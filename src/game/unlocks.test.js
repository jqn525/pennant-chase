import { describe, it, expect } from "vitest";
import { blankState, found, tick, toSave, loadState, liveStep, advance } from "./franchise.js";
import { options } from "./advisor.js";
import { isOpen } from "./unlocks.js";
import { noteBeats } from "./beats.js";
import { CARD_TIERS, nextPrint } from "./cards.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); return s; };

describe("progressive unlocks", () => {
  it("a new club starts with training only, then systems open with one news line each", () => {
    const s = fresh();
    expect(s.unlocked).toEqual([]);
    expect(new Set(options(s).map((o) => o.kind))).toEqual(new Set(["Train"]));
    for (let i = 0; i < 3; i++) tick(s, "max");
    expect(isOpen(s, "gear")).toBe(true);
    expect(options(s).some((o) => o.kind === "Gear")).toBe(true);
    expect(s.log.filter((e) => /gear dealer/.test(e.text)).length).toBe(1);
    for (let i = 0; i < 10; i++) tick(s, "max");
    expect(isOpen(s, "ballpark")).toBe(true);
    expect(isOpen(s, "trades")).toBe(false);
    expect(s.log.filter((e) => /gear dealer/.test(e.text)).length).toBe(1);
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.unlocked).toEqual(s.unlocked);
  });

  it("saves from before unlocks keep everything open", () => {
    const s = fresh();
    const old = toSave(s); delete old.unlocked;
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(back.unlocked).toBe(null);
    expect(isOpen(back, "trades")).toBe(true);
  });
});

describe("beats and ticker", () => {
  it("fan milestones fire once; streaks fire at 5", () => {
    const s = fresh();
    s.hist.n = 1;
    s.fans = 2600;
    expect(noteBeats(s, { att: 0, attCap: 8000, streak: 1 })[0]).toMatch(/2,500 fans/);
    expect(noteBeats(s, { att: 0, attCap: 8000, streak: 2 })).toEqual([]);
    expect(noteBeats(s, { att: 0, attCap: 8000, streak: 5 })[0]).toMatch(/5 wins in a row/);
    expect(noteBeats(s, { att: 8000, attCap: 8000, streak: 0 })[0]).toMatch(/Sold out/);
  });

  it("the live feed keeps the last 8 plays and starts fresh each game", () => {
    const s = fresh();
    advance(s);
    for (let i = 0; i < 30 && !s.live.over; i++) liveStep(s);
    expect(s.live.feed.length).toBeLessThanOrEqual(8);
    expect(s.live.feed[0].t).toEqual(expect.any(String));
  });

  it("star power keeps the old card economics", () => {
    expect(CARD_TIERS.map((t) => [t.at, t.cost, t.draw])).toEqual([[0, 0, 0], [70, 750, 0.1], [80, 10000, 0.3], [88, 50000, 0.6]]);
    expect(nextPrint({ role: "bat", contact: 90, power: 90, eye: 90, speed: 90, defense: 90, cardTier: 1 }).deal).toBe("Bobblehead night");
  });
});
