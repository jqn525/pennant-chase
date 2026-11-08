// ── Player, roster, rival-team, and draft-class generation ──

import { FIRST, LAST, POSITIONS, TRAITS, BAT_STATS, PIT_STATS, PLAYER_TRAITS, LEAGUE, DRAFT, CREEP, CITY_POOL, NICKNAME_POOL } from "./constants.js";
import { jitter } from "./utils.js";
import { sortRival } from "./lineup.js";
import { rollTalent, drawTier, TIERS, isPitcherRole } from "./talent.js";
import { ovr } from "./gear.js";

let uid = 1;
// After loading a save, push the id counter past the saved players' ids
export const seedUid = (n) => { if (n > uid) uid = n; };

// Names in use across the league — no two active players ever share one
const usedNames = new Set();
export const seedNames = (names) => names.forEach((n) => usedNames.add(n));
const rname = () => {
  for (let tries = 0; tries < 30; tries++) {
    const n = FIRST[(Math.random() * FIRST.length) | 0] + " " + LAST[(Math.random() * LAST.length) | 0];
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n;
    }
  }
  // pool exhausted beyond belief — allow a repeat rather than loop forever
  return FIRST[(Math.random() * FIRST.length) | 0] + " " + LAST[(Math.random() * LAST.length) | 0];
};
export const freshName = () => rname();

// Team identities: unique town + nickname combos for a league
export const genTeamIdentity = (usedCities, usedNames) => {
  let tCity = CITY_POOL[(Math.random() * CITY_POOL.length) | 0];
  for (let i = 0; i < 30 && usedCities.has(tCity); i++) tCity = CITY_POOL[(Math.random() * CITY_POOL.length) | 0];
  let name = NICKNAME_POOL[(Math.random() * NICKNAME_POOL.length) | 0];
  for (let i = 0; i < 30 && usedNames.has(name); i++) name = NICKNAME_POOL[(Math.random() * NICKNAME_POOL.length) | 0];
  usedCities.add(tCity);
  usedNames.add(name);
  return { tCity, name };
};

export const pickTrait = (role) => {
  const pool = PLAYER_TRAITS.filter((t) => t.role === role);
  return pool[(Math.random() * pool.length) | 0].id;
};

// Potential ceilings: at least +8 headroom over the rolled stat, clustering
// around +18, hard-capped at 97. Scouts can't teach what isn't there.
const POT_CAP = () => LEAGUE.statCap - 2; // 97 — perfection stays out of reach
export const rollPot = (p, keys, min = 8, spread = 20) => {
  const pot = {};
  for (const k of keys) pot[k] = Math.min(p[k] + min + ((Math.random() * spread) | 0), POT_CAP());
  return pot;
};
// Veterans acquired in trades have little left to learn: +4..+12
export const vetPot = (p, keys) => rollPot(p, keys, 4, 9);

// Players come from talent.js: a tier (most are regulars, few are stars),
// a shape, an age and a personal ceiling. `base` is kept for old callers.
export const genBatter = (pos, base, opts = {}) => ({
  id: uid++, name: rname(), pos, role: "bat",
  pull: (Math.random() * 1.2 - 0.6), // negative = pulls left, positive = slices right
  trait: pickTrait("bat"),
  ...rollTalent("bat", opts),
});

export const genPitcher = (pos, base, opts = {}) => ({
  id: uid++, name: rname(), pos, role: pos,
  trait: pickTrait("pit"),
  ...rollTalent(pos, opts),
});

// A pitching staff: five starters (best first), a setup man and a closer
export const genStaff = (base, make = genPitcher) => ({
  rotation: Array.from({ length: 5 }, () => make("SP", base)).sort((x, y) => ovr(y) - ovr(x)),
  pen: [make("RP", base), make("CL", base)],
});

// A September call-up: young, cheap, replacement-to-regular level
export const genCallUp = (pos) => {
  const opts = { tier: Math.random() < 0.6 ? TIERS[0] : TIERS[1], age: 22 + ((Math.random() * 4) | 0) };
  return isPitcherRole(pos) ? genPitcher(pos, 0, opts) : genBatter(pos, 0, opts);
};
// A rival's replacement for a retiree: mostly young, now and then a journeyman
export const genReplacement = (pos, shift = 0) => {
  const age = Math.random() < 0.75 ? 21 + ((Math.random() * 5) | 0) : 28 + ((Math.random() * 5) | 0);
  const opts = { tier: drawTier(shift), age };
  return isPitcherRole(pos) ? genPitcher(pos, 0, opts) : genBatter(pos, 0, opts);
};

export const genRoster = (base) => ({
  batters: POSITIONS.map((p) => genBatter(p, base)),
  ...genStaff(base),
});

// Every real club has a marquee name or two. Boost a player's core skills
// so rival lineups carry genuine stars, not eleven league-average guys.
export const seedRivalStars = (team) => team; // tiers make the stars now

// A persistent rival club: fixed name, fixed team trait, roster that lives in
// the save. Rival players get personality traits but no potentials — their
// front offices churn rosters every winter instead of training one man forever.
export const genRivalTeam = (name, traitId, base) => {
  const trait = TRAITS.find((t) => t.id === traitId);
  const m = trait.mod;
  // the club's identity nudges its players' shape (sluggers hit for power, aces pitch)
  const flavor = (p) => {
    const q = { ...p, pot: { ...p.pot } };
    for (const k in m) if (q[k] != null) { q[k] = Math.min(LEAGUE.statCap, Math.max(35, q[k] + m[k])); q.pot[k] = Math.max(q[k], q.pot[k] + m[k]); }
    return q;
  };
  const staff = genStaff(base);
  return sortRival({
    name,
    traitId,
    batters: POSITIONS.map((pos) => flavor(genBatter(pos, base))),
    rotation: staff.rotation.map(flavor),
    pen: staff.pen.map(flavor),
  });
};

// Rival development: spread `points` random +bump boosts across the club.
// The offseason uses the big CREEP.bump; in-season growth passes a small one.
export const creepRival = (team, points, bump = CREEP.bump) => {
  const t = {
    ...team,
    batters: team.batters.map((p) => ({ ...p })),
    rotation: team.rotation.map((p) => ({ ...p })),
    pen: team.pen.map((p) => ({ ...p })),
  };
  // every player, bat or arm, has the same chance to improve; budgets were set
  // for the old 10-player club (49 stat slots), so scale them to the full roster
  const tSpots = [];
  for (const p of t.batters) for (const k of BAT_STATS) tSpots.push([p, k]);
  for (const p of [...t.rotation, ...t.pen]) for (const k of ["stuff", "control", "stamina", "stuff", "control"]) tSpots.push([p, k]);
  // front offices can only develop what's there: nobody passes his own ceiling
  const n = Math.round(points * tSpots.length / 49);
  for (let i = 0; i < n; i++) {
    const [p, k] = tSpots[(Math.random() * tSpots.length) | 0];
    const ceil = p.pot?.[k] ?? LEAGUE.statCap;
    if (p[k] < ceil) p[k] = Math.min(ceil, p[k] + bump);
  }
  return sortRival(t);
};

// The winter draft class: raw rookies with big ceilings. The worse you
// finished (finish 0 = champs, 7 = cellar), the better the prospects.
export const genDraftClass = (finish) => {
  // worse finish (higher index) = better picks: the tier draw leans up
  const shift = finish / 7 - 0.2;
  const slots = [Math.random() < 0.6 ? "SP" : Math.random() < 0.5 ? "RP" : "CL"];
  const shuffled = [...POSITIONS].sort(() => Math.random() - 0.5);
  while (slots.length < DRAFT.classSize) slots.push(shuffled[slots.length - 1]);
  return slots.map((pos) => {
    const opts = { tier: drawTier(shift + 0.6), age: 20 + ((Math.random() * 3) | 0) };
    const p = isPitcherRole(pos) ? genPitcher(pos, 0, opts) : genBatter(pos, 0, opts);
    p.years = 0;
    const keys = isPitcherRole(pos) ? PIT_STATS : BAT_STATS;
    const ceiling = keys.reduce((n, k) => n + p.pot[k], 0) / keys.length;
    p.signCost = Math.max(DRAFT.signBase, Math.round(DRAFT.signBase + Math.max(0, ceiling - LEAGUE.statBase) * DRAFT.signPerPot));
    return p;
  });
};
