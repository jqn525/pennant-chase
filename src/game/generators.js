// ── Player, roster, and rival-team generation ──

import { FIRST, LAST, POSITIONS, TRAITS, BAT_STATS, PIT_STATS } from "./constants.js";
import { jitter } from "./utils.js";

let uid = 1;
// After loading a save, push the id counter past the saved players' ids
export const seedUid = (n) => { if (n > uid) uid = n; };

const rname = () => FIRST[(Math.random() * FIRST.length) | 0] + " " + LAST[(Math.random() * LAST.length) | 0];

export const genBatter = (pos, base) => ({
  id: uid++, name: rname(), pos, role: "bat",
  contact: jitter(base), power: jitter(base), eye: jitter(base), speed: jitter(base), defense: jitter(base),
  pull: (Math.random() * 1.2 - 0.6), // negative = pulls left, positive = slices right
});

export const genPitcher = (pos, base) => ({
  id: uid++, name: rname(), pos, role: pos,
  stuff: jitter(base), control: jitter(base), stamina: jitter(base), defense: jitter(base),
});

export const genRoster = (base) => ({
  batters: POSITIONS.map((p) => genBatter(p, base)),
  sp: genPitcher("SP", base),
  rp: genPitcher("RP", Math.max(1, base - 1)),
});

// A persistent rival club: fixed name, fixed trait (stored by id and
// rehydrated on load), roster that lives in the save and improves each winter.
export const genRivalTeam = (name, traitId, base) => {
  const trait = TRAITS.find((t) => t.id === traitId);
  const m = trait.mod;
  const b = (k) => Math.max(1, jitter(base) + (m[k] || 0));
  return {
    name,
    traitId,
    batters: POSITIONS.map((p) => ({
      id: uid++, name: rname(), pos: p, role: "bat",
      contact: b("contact"), power: b("power"), eye: b("eye"), speed: b("speed"), defense: b("defense"),
      pull: (Math.random() * 1.2 - 0.6),
    })),
    sp: { id: uid++, name: rname(), pos: "SP", role: "SP", stuff: b("stuff"), control: b("control"), stamina: jitter(base), defense: b("defense") },
  };
};

// Offseason development: spread `points` random +1 bumps across the club
export const creepRival = (team, points) => {
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
    p[k] += 1;
  }
  return t;
};
