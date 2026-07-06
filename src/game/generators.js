// ── Player, roster, and opponent generation ──

import { FIRST, LAST, POSITIONS, TRAITS, OPP_NAMES, LEAGUES, BAT_STATS, PIT_STATS } from "./constants.js";
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

// The recruiting class: when the club climbs a league, every player develops
// to at least the new league's level (the reliever stays a notch behind).
// Trained stats above the floor carry over untouched.
export const developRoster = (roster, base) => {
  const lift = (p, keys, floor) => {
    const q = { ...p };
    keys.forEach((k) => { q[k] = Math.max(q[k], floor); });
    return q;
  };
  return {
    batters: roster.batters.map((b) => lift(b, BAT_STATS, base)),
    sp: lift(roster.sp, PIT_STATS, base),
    rp: lift(roster.rp, PIT_STATS, Math.max(1, base - 1)),
  };
};

export const genOpponent = (tier) => {
  const trait = TRAITS[(Math.random() * TRAITS.length) | 0];
  const base = LEAGUES[tier].statBase;
  const m = trait.mod;
  const b = (k) => Math.max(1, jitter(base) + (m[k] || 0));
  return {
    name: OPP_NAMES[(Math.random() * OPP_NAMES.length) | 0],
    trait,
    batters: POSITIONS.map((p) => ({
      id: uid++, name: rname(), pos: p, role: "bat",
      contact: b("contact"), power: b("power"), eye: b("eye"), speed: b("speed"), defense: b("defense"),
      pull: (Math.random() * 1.2 - 0.6),
    })),
    sp: { id: uid++, name: rname(), pos: "SP", role: "SP", stuff: b("stuff"), control: b("control"), stamina: jitter(base), defense: b("defense") },
  };
};
