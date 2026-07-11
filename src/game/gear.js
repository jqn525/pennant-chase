// ── Equipment: procedurally generated loot and effective-stat helpers ──
// Gear lives on the player as p.gear = { bat: item, cleats: item } (slot -> item).
// An item: { id, slot, rarity 1..3, name, boosts: {stat: ±percent}, cost }.
// Boosts are PERCENTAGES of the player's rating (+5/+10/+15% by rarity;
// secondaries ±4%), applied multiplicatively and capped at 99 — gear can
// push a rating toward perfect, never past it.

import { LEAGUE, RARITY, BAT_STATS, PIT_STATS, PLAYER_TRAITS } from "./constants.js";

// Trait lookup + the static percentage a player's trait puts on one stat
export const traitInfo = (id) => PLAYER_TRAITS.find((t) => t.id === id) || null;
const traitPct = (p, stat) => traitInfo(p.trait)?.mods?.[stat] || 0;

// Pixel-art sprite tiles in public/gear/ (48×48, beige square tiles).
// Slots with several looks have <slot>.png, <slot>2.png, ... — an item's id
// hashes to one look so the same item always shows the same art.
export const GEAR_ART = new Set(["bat", "batGloves", "cleats", "glove", "shades", "sleeve", "rosin"]);
const GEAR_VARIANTS = { bat: 2, batGloves: 3, cleats: 3, glove: 3, shades: 3, sleeve: 3, rosin: 1 };
export const gearArtUrl = (itemOrSlot) => {
  const slot = typeof itemOrSlot === "string" ? itemOrSlot : itemOrSlot.slot;
  let v = 0;
  if (typeof itemOrSlot !== "string" && itemOrSlot.id) {
    let h = 0;
    for (let i = 0; i < itemOrSlot.id.length; i++) h = (h * 31 + itemOrSlot.id.charCodeAt(i)) % 9973;
    v = h % (GEAR_VARIANTS[slot] || 1);
  }
  return `${import.meta.env.BASE_URL}gear/${slot}${v ? v + 1 : ""}.png`;
};

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
  const boosts = { [def.stat]: RARITY[rarity].pct };
  let costMult = 1;
  if (rarity >= 2) {
    const pool = (def.role === "bat" ? BAT_STATS : PIT_STATS).filter((s) => s !== def.stat);
    const stat = pick(pool);
    const plus = Math.random() < 0.6;
    boosts[stat] = plus ? 4 : -4;
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

// The gear dealers only court real clubs. Rarity odds scale with prestige:
// a year-one nobody never sees a legendary; contenders get a taste;
// champions get the full catalog.
export const dealerTier = (trophies, playoffsEver) =>
  trophies > 0 ? "champion" : playoffsEver ? "contender" : "local";

export const TIER_INFO = {
  local: { label: "LOCAL DEALERS", hint: "make the playoffs to attract rarer stock" },
  contender: { label: "CONTENDER DEALERS", hint: "win the Cup for the full catalog" },
  champion: { label: "CHAMPION'S CATALOG", hint: "the best gear in the league finds you" },
};

export const shipmentWeights = (tier, mega = false) => {
  if (mega) {
    return tier === "champion" ? { 1: 0, 2: 60, 3: 40 }
      : tier === "contender" ? { 1: 0, 2: 75, 3: 25 }
      : { 1: 0, 2: 100, 3: 0 };
  }
  return tier === "champion" ? { 1: 65, 2: 28, 3: 7 }
    : tier === "contender" ? { 1: 70, 2: 27, 3: 3 }
    : { 1: 80, 2: 20, 3: 0 };
};

// A shipment: n items across varied slots. Pass weights from shipmentWeights().
export const genShipment = (n = 6, weights = null) => {
  const slots = [...GEAR].sort(() => Math.random() - 0.5);
  return Array.from({ length: n }, (_, i) => genItem(rollRarity(weights), slots[i % slots.length]));
};

// Total gear percentage applying to one stat
const gearPct = (p, stat) => {
  if (!p.gear) return 0;
  let pct = 0;
  for (const def of GEAR) {
    const item = p.gear[def.slot];
    if (!item) continue;
    if (typeof item === "number") { if (def.stat === stat) pct += item * 5; } // legacy tiers ≈ 5/10/15%
    else if (item.boosts?.[stat]) pct += item.boosts[stat];
  }
  return pct;
};

// Effective rating after gear: multiplicative, capped at 99, floored at 1
const boosted = (v, pct) => Math.min(LEAGUE.statCap, Math.max(1, Math.round(v * (1 + pct / 100))));

// The point delta gear + trait add to one stat (for display: "78 +9")
export const gearBonus = (p, stat) => {
  const pct = gearPct(p, stat) + traitPct(p, stat);
  return pct ? boosted(p[stat], pct) - p[stat] : 0;
};

// Effective player: ratings with all gear AND trait percentages applied.
// Identity for players with neither (keeps hot loops cheap).
export const eff = (p) => {
  if (!p.gear && !traitInfo(p.trait)?.mods) return p;
  const q = { ...p };
  const stats = p.role === "bat" ? BAT_STATS : PIT_STATS;
  for (const s of stats) {
    const pct = gearPct(p, s) + traitPct(p, s);
    if (pct) q[s] = boosted(q[s], pct);
  }
  return q;
};

export const isStar = (p) => {
  const e = eff(p);
  return p.role === "bat"
    ? (e.contact + e.power + e.eye + e.speed) / 4 >= 73
    : (e.stuff + e.control) / 2 >= 73;
};

// Player overall: mean of effective attributes for his role
export const ovr = (p) => {
  const e = eff(p);
  return p.role === "bat"
    ? (e.contact + e.power + e.eye + e.speed + e.defense) / 5
    : (e.stuff + e.control + e.stamina) / 3;
};

// Trade value: how far above the league floor a player plays
export const playerValue = (p, perOvr) => Math.max(50, (ovr(p) - LEAGUE.statBase + 4) * perOvr);

// Team talent vs the league level, as a letter grade
export const talentGrade = (roster, statBase = LEAGUE.statBase) => {
  const all = [...roster.batters, roster.sp, roster.rp];
  const diff = all.reduce((n, p) => n + ovr(p), 0) / all.length - statBase;
  return diff >= 10 ? "S" : diff >= 6 ? "A" : diff >= 2 ? "B" : diff >= -2 ? "C" : "D";
};
