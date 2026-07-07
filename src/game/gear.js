// ── Equipment: the Pro Shop catalog and effective-stat helpers ──
// Gear lives on the player object as p.gear = { bat: 2, cleats: 1 } (slot -> tier).
// Tier number IS the stat bonus (+1/+2/+3). Players without gear (opponents,
// old saves) pass through eff() untouched.

import { LEAGUE } from "./constants.js";

export const TIER_NAMES = { 1: "Standard", 2: "Pro", 3: "Elite" };

export const GEAR = [
  { slot: "bat", label: "Bat", stat: "power", role: "bat", flavor: "More carry off the barrel" },
  { slot: "batGloves", label: "Batting Gloves", stat: "contact", role: "bat", flavor: "Better feel, squarer contact" },
  { slot: "cleats", label: "Cleats", stat: "speed", role: "bat", flavor: "First step and extra bases" },
  { slot: "glove", label: "Fielding Glove", stat: "defense", role: "bat", flavor: "Turns hits into outs" },
  { slot: "shades", label: "Shades", stat: "eye", role: "bat", flavor: "See the ball, spit on the bad ones" },
  { slot: "sleeve", label: "Arm Sleeve", stat: "stuff", role: "pit", flavor: "Extra life on the fastball" },
  { slot: "rosin", label: "Rosin Bag", stat: "control", role: "pit", flavor: "Grip it and hit the corner" },
];

export const gearBonus = (p, stat) => {
  const item = GEAR.find((g) => g.stat === stat);
  return item ? (p.gear?.[item.slot] ?? 0) : 0;
};

// Effective player: base stats + gear bonuses. Identity for gearless players.
export const eff = (p) => {
  if (!p.gear) return p;
  const q = { ...p };
  for (const g of GEAR) {
    const t = p.gear[g.slot];
    if (t) q[g.stat] = (q[g.stat] ?? 0) + t;
  }
  return q;
};

// ~5 / 15 / 35 wins' pay — gear is a luxury that takes seasons to accumulate
export const gearCost = (itemTier) =>
  Math.ceil(LEAGUE.payWin * [0, 5, 15, 35][itemTier]);

// Per-league shelf: 3 Standard, 2 Pro, 1 Elite of every item. Restocks on promotion.
export const freshStock = () => {
  const s = {};
  for (const g of GEAR) s[g.slot] = { 1: 3, 2: 2, 3: 1 };
  return s;
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

// Team talent vs the league level, as a letter grade
export const talentGrade = (roster, statBase = LEAGUE.statBase) => {
  const all = [...roster.batters, roster.sp, roster.rp];
  const diff = all.reduce((n, p) => n + ovr(p), 0) / all.length - statBase;
  return diff >= 2.5 ? "S" : diff >= 1.5 ? "A" : diff >= 0.5 ? "B" : diff >= -0.5 ? "C" : "D";
};
