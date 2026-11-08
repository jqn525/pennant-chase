// ── Talent and careers ──
// Most players are regulars; a few are stars; superstars are rare. Every
// player has his own ceiling, an age, and a career that rises, peaks and
// fades. Pure helpers: generators.js builds players with them, season.js
// ages everyone with them each winter.

import { BAT_STATS, PIT_STATS, LEAGUE } from "./constants.js";

export const MAX_RATING = 95;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
const irnd = (lo, hi) => Math.floor(rnd(lo, hi + 1));
const pick = (weighted) => {
  const total = weighted.reduce((t, [, w]) => t + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of weighted) if ((r -= w) <= 0) return v;
  return weighted[weighted.length - 1][0];
};

// Peak level a player will reach, by tier. Weights are the league's shape.
export const TIERS = [
  { id: "replacement", label: "Replacement", w: 20, lo: 52, hi: 58 },
  { id: "regular", label: "Regular", w: 45, lo: 59, hi: 66 },
  { id: "solid", label: "Solid", w: 22, lo: 67, hi: 72 },
  { id: "star", label: "Star", w: 10, lo: 73, hi: 80 },
  { id: "superstar", label: "Superstar", w: 3, lo: 81, hi: 88 },
];
// shift < 0 makes the draw leaner (used to anchor an inflated league)
export const drawTier = (shift = 0) => pick(TIERS.map((t, i) => [t, Math.max(0.5, t.w * (1 + shift * (i - 1.5) * 0.35))]));
export const tierOf = (peak) => [...TIERS].reverse().find((t) => peak >= t.lo) || TIERS[0];

// Shapes: what a player is good at, not just how good
const BAT_ARCH = [
  [{ id: "slugger", label: "Slugger", mod: { power: 8, contact: -3, speed: -5, eye: 1 } }, 20],
  [{ id: "contact", label: "Contact hitter", mod: { contact: 7, power: -5, eye: 2 } }, 22],
  [{ id: "speed", label: "Speedster", mod: { speed: 10, power: -6, defense: 2 } }, 15],
  [{ id: "glove", label: "Glove first", mod: { defense: 10, contact: -3, power: -3 } }, 15],
  [{ id: "patient", label: "On-base", mod: { eye: 8, contact: 2, power: -3, speed: -2 } }, 13],
  [{ id: "balanced", label: "All-around", mod: {} }, 15],
];
const ARM_ARCH = [
  [{ id: "power", label: "Power arm", mod: { stuff: 8, control: -4 } }, 35],
  [{ id: "finesse", label: "Finesse", mod: { control: 8, stuff: -4 } }, 30],
  [{ id: "workhorse", label: "Workhorse", mod: { stamina: 8, stuff: -2 } }, 20],
  [{ id: "balanced", label: "Balanced", mod: {} }, 15],
];
export const ARCHETYPES = Object.fromEntries([...BAT_ARCH, ...ARM_ARCH].map(([a]) => [a.id, a.label]));

// Age mix for a roster: some rookies, a core in their prime, a few veterans
export const drawAge = () => pick([[irnd(21, 24), 25], [irnd(25, 31), 55], [irnd(32, 36), 20]]);

// How far below his peak a player sits at a given age
export function ageGap(age) {
  if (age <= 21) return 9;
  if (age <= 26) return [6, 4, 3, 2, 1][age - 22];
  if (age <= 31) return 0;
  return Math.min(14, [1, 2, 4, 6, 8, 10, 12, 14][age - 32] ?? 14);
}

// Build one player's ratings and ceilings. role: "bat" | "SP" | "RP" | "CL"
export function rollTalent(role, { tier = drawTier(), age = drawAge(), relief = role === "RP" || role === "CL" } = {}) {
  const keys = role === "bat" ? BAT_STATS : PIT_STATS;
  const arch = pick(role === "bat" ? BAT_ARCH : ARM_ARCH);
  const peak = rnd(tier.lo, tier.hi + 1);
  // late bloomers: a few players find another gear
  const bloom = age <= 28 && Math.random() < 0.05 ? irnd(5, 10) : 0;
  const now = peak - ageGap(age);
  const p = { age, years: Math.max(0, age - irnd(21, 23)), tier: tier.id, arch: arch.id, pot: {} };
  for (const k of keys) {
    const shape = arch.mod[k] || 0;
    const reliefMod = relief ? (k === "stuff" ? 4 : k === "stamina" ? -8 : 0) : 0;
    const v = clamp(Math.round(now + shape + reliefMod + rnd(-4, 4)), 35, MAX_RATING);
    p[k] = v;
    // the ceiling is where his peak would put this stat; veterans are already past it
    const ceil = age <= 31 ? Math.round(peak + shape + reliefMod + bloom + rnd(-2, 3)) : v;
    p.pot[k] = clamp(Math.max(v, ceil), 35, MAX_RATING);
  }
  return p;
}

// ── Winter: one year older ──
const FAST = { speed: true, stamina: true }; // legs and endurance go first
const SLOW = { eye: true, control: true, contact: true }; // the craft lasts longest

// Returns the player one season older (ratings and ceiling moved)
export function ageOneYear(p) {
  const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
  const q = { ...p, pot: { ...(p.pot || {}) }, age: (p.age ?? 27) + 1, years: (p.years ?? 0) + 1 };
  const a = q.age;
  for (const k of keys) {
    const ceil = q.pot[k] ?? q[k];
    let d;
    if (a <= 24) d = irnd(1, 4);
    else if (a <= 26) d = irnd(0, 2);
    else if (a <= 31) d = irnd(-1, 1);
    else if (a <= 34) d = -irnd(1, 3) - (FAST[k] ? 1 : 0) + (SLOW[k] ? 1 : 0);
    else d = -irnd(2, 5) - (FAST[k] ? 1 : 0) + (SLOW[k] ? 1 : 0);
    q[k] = d > 0 ? Math.min(ceil, q[k] + d) : clamp(q[k] + d, 35, MAX_RATING);
    // past 31 the ceiling falls too: nobody trains back to his peak
    if (a > 31) q.pot[k] = Math.max(q[k], ceil - 2);
  }
  return q;
}

// Chance he hangs them up this winter
export function retireChance(p, overall) {
  const a = p.age ?? 27;
  if (a >= 40) return 1;
  if (a < 33) return 0;
  const base = [0.1, 0.18, 0.25, 0.35, 0.5, 0.7, 0.85][a - 33] ?? 1;
  return Math.min(1, base + (overall < 60 ? 0.15 : 0));
}

// Career stage label for the UI
export function stage(age) {
  if (age == null) return "";
  if (age <= 24) return "Developing";
  if (age <= 26) return "Rising";
  if (age <= 31) return "Prime";
  if (age <= 34) return "Declining";
  return "Final years";
}

export const isPitcherRole = (r) => r === "SP" || r === "RP" || r === "CL";
export { LEAGUE };
