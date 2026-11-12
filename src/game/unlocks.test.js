import { describe, it, expect } from "vitest";
import { blankState, found, tick, toSave, loadState, liveStep, advance, openUnlocks, buyGear } from "./franchise.js";
import { startProgram } from "./training.js";
import { options } from "./advisor.js";
import { isOpen, nextObjective, objectivesLeft, pendingUnlock, ackUnlock, visitTab } from "./unlocks.js";
import { noteBeats } from "./beats.js";
import { CARD_TIERS, nextPrint } from "./cards.js";

const club = { name: "Vancouver", nickname: "Suns", bonus: "fans", label: "HUNGRY MARKET" };
const fresh = () => { const s = blankState(); found(s, club); return s; };

describe("progressive unlocks", () => {
  it("a new club starts with training only and one objective", () => {
    const s = fresh();
    expect(s.unlocked).toEqual([]);
    expect(new Set(options(s).map((o) => o.kind))).toEqual(new Set(["Train"]));
    expect(nextObjective(s)).toMatchObject({ id: "gear", goal: "Start a training program" });
    expect(objectivesLeft(s)).toBe(8);
  });

  it("doing the step opens the next system, once, with a card and a 'new' tab", () => {
    const s = fresh();
    s.speed = "max";
    const p = s.roster.batters[0];
    p.pot = { ...p.pot, contact: p.contact + 10 };
    expect(startProgram(s, p.id, "contact")).toBe(true);
    openUnlocks(s);
    expect(isOpen(s, "gear")).toBe(true);
    expect(s.log.filter((e) => /gear dealer/.test(e.text)).length).toBe(1);
    expect(pendingUnlock(s)).toMatchObject({ id: "gear", title: "The gear dealer", to: ["spend", "gear"] });
    expect(s.newTabs).toEqual({ spend: true });
    expect(s.speed).toBe(4); // MAX slows down so the card isn't missed
    openUnlocks(s);
    expect(s.fresh).toEqual(["gear"]);
    ackUnlock(s); visitTab(s, "spend");
    expect(pendingUnlock(s)).toBeNull();
    expect(s.newTabs).toEqual({});
    expect(nextObjective(s).id).toBe("autodev");
    // equipping gear brings in the equipment manager
    s.money = 1e5;
    const item = s.shopItems.find((i) => ["bat", "batGloves", "cleats", "glove", "shades"].includes(i.slot)) || s.shopItems[0];
    const who = item && s.shopItems.includes(item) && ["bat", "batGloves", "cleats", "glove", "shades"].includes(item.slot) ? s.roster.batters[0] : s.roster.rotation[0];
    expect(buyGear(s, who.id, item.id)).toBe(true);
    openUnlocks(s);
    expect(isOpen(s, "autodev")).toBe(true);
  });

  it("every step also opens by itself after enough games, and saves keep their place", () => {
    const s = fresh();
    s.training.auto = { hit: false, pitch: false, field: false };
    for (let i = 0; i < 6; i++) tick(s, "max");
    expect(isOpen(s, "gear")).toBe(true);
    expect(isOpen(s, "ballpark")).toBe(s.standings[0].w >= 5);
    for (let i = 0; i < 9; i++) tick(s, "max");
    for (const id of ["autodev", "lineup", "ballpark", "report"]) expect(isOpen(s, id)).toBe(true);
    expect(isOpen(s, "trades")).toBe(false);
    const obj = nextObjective(s);
    expect(["star", "assistants", "trades"]).toContain(obj.id);
    const back = loadState(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.unlocked).toEqual(s.unlocked);
    for (let i = 0; i < 20; i++) tick(s, "max");
    expect(isOpen(s, "trades")).toBe(true);
    expect(isOpen(s, "star")).toBe(true);
  });

  it("saves from before unlocks keep everything open, with no objective", () => {
    const s = fresh();
    const old = toSave(s); delete old.unlocked;
    const back = loadState(JSON.parse(JSON.stringify(old)));
    expect(back.unlocked).toBe(null);
    expect(isOpen(back, "trades")).toBe(true);
    expect(isOpen(back, "report")).toBe(true);
    expect(nextObjective(back)).toBeNull();
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
