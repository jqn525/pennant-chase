// ── Equipment: procedurally generated loot and effective-stat helpers ──
// Gear lives on the player as p.gear = { bat: item, cleats: item } (slot -> item).
// An item: { id, slot, rarity 1..3, name, boosts: {stat: ±n}, cost }.
// Primary boost = the slot's stat (+1/+2/+3 by rarity); RARE and LEGENDARY
// items also roll a secondary side-effect on another stat (+1 or -1).

import { LEAGUE, RARITY, BAT_STATS, PIT_STATS } from "./constants.js";

export const GEAR = [
  { slot: "bat", label: "Bat", stat: "power", role: "bat", flavor: "More carry off the barrel" },
  { slot: "batGloves", label: "Batting Gloves", stat: "contact", role: "bat", flavor: "Better feel, squarer contact" },
  { slot: "cleats", label: "Cleats", stat: "speed", role: "bat", flavor: "First step and extra bases" },
  { slot: "glove", label: "Fielding Glove", stat: "defense", role: "bat", flavor: "Turns hits into outs" },
  { slot: "shades", label: "Shades", stat: "eye", role: "bat", flavor: "See the ball, spit on the bad ones" },
  { slot: "sleeve", label: "Arm Sleeve", stat: "stuff", role: "pit", flavor: "Extra life on the fastball" },
  { slot: "rosin", label: "Rosin Bag", stat: "control", role: "pit", flavor: "Grip it and hit the corner" },
];

const NAMES = {
  bat: [["Ash", "Maple", "Birch", "Hickory", "Bamboo", "Corked"], ["Hammer", "Cannon", "Whisperer", "Thunderstick", "Toothpick", "Wand"]],
  batGloves: [["Buttery", "Sticky", "Golden", "Broken-In", "Rodeo"], ["Grips", "Mitts", "Palms", "Handles", "Leathers"]],
  cleats: [["Turbo", "Feather", "Dirt-Eater", "Lightning", "Greased"], ["Spikes", "Wheels", "Streaks", "Stompers", "Skates"]],
  glove: [["Vacuum", "Basket", "Soft-Hand", "Web", "Flypaper"], ["Wizard", "Trap", "Net", "Scoop", "Magnet"]],
  shades: [["Eagle-Eye", "Midnight", "Chrome", "Hawk", "X-Ray"], ["Shades", "Visors", "Lenses", "Specs", "Goggles"]],
  sleeve: [["Rocket", "Iron", "Coiled", "Viper", "Piston"], ["Sleeve", "Wrap", "Spring", "Cannon-Arm", "Compressor"]],
  rosin: [["Sticky", "Chalky", "Lucky", "Tacky", "Magic"], ["Situation", "Bag", "Dust", "Pouch", "Powder"]],
};

const pick = (a) => a[(Math.random() * a.length) | 0];

export const genItem = (rarity, slotDef) => {
  const def = slotDef || GEAR[(Math.random() * GEAR.length) | 0];
  const [pre, post] = NAMES[def.slot];
  let name = `${pick(pre)} ${pick(post)}`;
  if (rarity === 3) name = `The ${name}`;
  const boosts = { [def.stat]: rarity };
  let costMult = 1;
  if (rarity >= 2) {
    const pool = (def.role === "bat" ? BAT_STATS : PIT_STATS).filter((s) => s !== def.stat);
    const stat = pick(pool);
    const plus = Math.random() < 0.6;
    boosts[stat] = plus ? 1 : -1;
    costMult = plus ? 1.2 : 0.8;
  }
  return {
    id: `${def.slot}-${Math.random().toString(36).slice(2, 9)}`,
    slot: def.slot, rarity, name, boosts,
    cost: Math.round(RARITY[rarity].cost * costMult),
  };
};

const rollRarity = (weights) => {
  const w1 = weights?.[1] ?? RARITY[1].weight, w2 = weights?.[2] ?? RARITY[2].weight, w3 = weights?.[3] ?? RARITY[3].weight;
  const r = Math.random() * (w1 + w2 + w3);
  return r < w1 ? 1 : r < w1 + w2 ? 2 : 3;
};

// A shipment: n items across varied slots. Pass offseason weights {1:0, 2:60, 3:40}
// for the winter catalog.
export const genShipment = (n = 6, weights = null) => {
  const slots = [...GEAR].sort(() => Math.random() - 0.5);
  return Array.from({ length: n }, (_, i) => genItem(rollRarity(weights), slots[i % slots.length]));
};

// Sum of gear boosts for one stat. Tolerates the pre-loot save format
// (slot -> tier number) just in case migration is skipped.
export const gearBonus = (p, stat) => {
  if (!p.gear) return 0;
  let n = 0;
  for (const def of GEAR) {
    const item = p.gear[def.slot];
    if (!item) continue;
    if (typeof item === "number") { if (def.stat === stat) n += item; }
    else if (item.boosts?.[stat]) n += item.boosts[stat];
  }
  return n;
};

// Effective player: base stats + all gear boosts (never below 1).
// Identity for gearless players (opponents without equipment, fresh rosters).
export const eff = (p) => {
  if (!p.gear) return p;
  const q = { ...p };
  for (const def of GEAR) {
    const item = p.gear[def.slot];
    if (!item) continue;
    if (typeof item === "number") q[def.stat] = (q[def.stat] ?? 0) + item;
    else for (const s in item.boosts) q[s] = Math.max(1, (q[s] ?? 0) + item.boosts[s]);
  }
  return q;
};

export const isStar = (p) => {
  const e = eff(p);
  return p.role === "bat"
    ? (e.contact + e.power + e.eye + e.speed) / 4 >= 8
    : (e.stuff + e.control) / 2 >= 8;
};

// Player overall: mean of effective attributes for his role
export const ovr = (p) => {
  const e = eff(p);
  return p.role === "bat"
    ? (e.contact + e.power + e.eye + e.speed + e.defense) / 5
    : (e.stuff + e.control + e.stamina) / 3;
};

// Trade value: how far above the league floor a player plays
export const playerValue = (p, perOvr) => Math.max(50, (ovr(p) - LEAGUE.statBase + 1) * perOvr);

// Team talent vs the league level, as a letter grade
export const talentGrade = (roster, statBase = LEAGUE.statBase) => {
  const all = [...roster.batters, roster.sp, roster.rp];
  const diff = all.reduce((n, p) => n + ovr(p), 0) / all.length - statBase;
  return diff >= 2.5 ? "S" : diff >= 1.5 ? "A" : diff >= 0.5 ? "B" : diff >= -0.5 ? "C" : "D";
};
