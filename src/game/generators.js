// ── Player, roster, rival-team, and draft-class generation ──

import { FIRST, LAST, POSITIONS, TRAITS, BAT_STATS, PIT_STATS, PLAYER_TRAITS, LEAGUE, DRAFT, CREEP, CITY_POOL, NICKNAME_POOL } from "./constants.js";
import { jitter } from "./utils.js";

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

export const genBatter = (pos, base) => {
  const p = {
    id: uid++, name: rname(), pos, role: "bat",
    contact: jitter(base, 10), power: jitter(base, 10), eye: jitter(base, 10), speed: jitter(base, 10), defense: jitter(base, 10),
    pull: (Math.random() * 1.2 - 0.6), // negative = pulls left, positive = slices right
    trait: pickTrait("bat"),
  };
  p.pot = rollPot(p, BAT_STATS);
  return p;
};

export const genPitcher = (pos, base) => {
  const p = {
    id: uid++, name: rname(), pos, role: pos,
    stuff: jitter(base, 10), control: jitter(base, 10), stamina: jitter(base, 10), defense: jitter(base, 10),
    trait: pickTrait("pit"),
  };
  p.pot = rollPot(p, PIT_STATS);
  return p;
};

export const genRoster = (base) => ({
  batters: POSITIONS.map((p) => genBatter(p, base)),
  sp: genPitcher("SP", base),
  rp: genPitcher("RP", Math.max(40, base - 4)),
});

// Every real club has a marquee name or two. Boost a player's core skills
// so rival lineups carry genuine stars, not eleven league-average guys.
export const seedRivalStars = (team) => {
  const picks = [...team.batters].sort(() => Math.random() - 0.5).slice(0, 2);
  for (const p of picks) for (const k of ["contact", "power", "eye", "speed"]) {
    p[k] = Math.min(LEAGUE.statCap, p[k] + jitter(12, 4));
  }
  if (Math.random() < 0.5) for (const k of ["stuff", "control"]) {
    team.sp[k] = Math.min(LEAGUE.statCap, team.sp[k] + jitter(12, 4));
  }
  return team;
};

// A persistent rival club: fixed name, fixed team trait, roster that lives in
// the save. Rival players get personality traits but no potentials — their
// front offices churn rosters every winter instead of training one man forever.
export const genRivalTeam = (name, traitId, base) => {
  const trait = TRAITS.find((t) => t.id === traitId);
  const m = trait.mod;
  const b = (k) => Math.min(LEAGUE.statCap, Math.max(40, jitter(base, 10) + (m[k] || 0)));
  return seedRivalStars({
    name,
    traitId,
    batters: POSITIONS.map((p) => ({
      id: uid++, name: rname(), pos: p, role: "bat",
      contact: b("contact"), power: b("power"), eye: b("eye"), speed: b("speed"), defense: b("defense"),
      pull: (Math.random() * 1.2 - 0.6),
      trait: pickTrait("bat"),
    })),
    sp: { id: uid++, name: rname(), pos: "SP", role: "SP", stuff: b("stuff"), control: b("control"), stamina: jitter(base, 10), defense: b("defense"), trait: pickTrait("pit") },
  });
};

// Rival development: spread `points` random +bump boosts across the club.
// The offseason uses the big CREEP.bump; in-season growth passes a small one.
export const creepRival = (team, points, bump = CREEP.bump) => {
  const t = {
    ...team,
    batters: team.batters.map((p) => ({ ...p })),
    sp: { ...team.sp },
  };
  const tSpots = [];
  for (const p of t.batters) for (const k of BAT_STATS) tSpots.push([p, k]);
  for (const k of PIT_STATS) tSpots.push([t.sp, k]);
  for (let i = 0; i < points; i++) {
    const [p, k] = tSpots[(Math.random() * tSpots.length) | 0];
    p[k] = Math.min(LEAGUE.statCap, p[k] + bump);
  }
  return t;
};

// The winter draft class: raw rookies with big ceilings. The worse you
// finished (finish 0 = champs, 7 = cellar), the better the prospects.
export const genDraftClass = (finish) => {
  const qBonus = Math.round(finish / 2) * 4; // worse finish = higher ceilings (new-unit spread)
  const base = LEAGUE.statBase;
  // guarantee at least one arm; the rest random field positions
  const slots = [Math.random() < 0.5 ? "SP" : "RP"];
  const shuffled = [...POSITIONS].sort(() => Math.random() - 0.5);
  while (slots.length < DRAFT.classSize) slots.push(shuffled[slots.length - 1]);
  return slots.map((pos) => {
    const isPit = pos === "SP" || pos === "RP";
    const p = isPit ? genPitcher(pos, base - 4) : genBatter(pos, base - 4);
    // rookies re-roll ceilings HIGH: +16..(+31+quality), capped at 97
    p.pot = rollPot(p, isPit ? PIT_STATS : BAT_STATS, 16, 16 + qBonus);
    const keys = isPit ? PIT_STATS : BAT_STATS;
    const headroom = keys.reduce((n, k) => n + (p.pot[k] - base), 0) / keys.length;
    p.signCost = Math.max(DRAFT.signBase, Math.round(DRAFT.signBase + headroom * DRAFT.signPerPot));
    return p;
  });
};
