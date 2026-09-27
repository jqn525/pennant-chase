// ── Lineup loadouts: batting-order philosophies ──
// A lineup is a belief about run-scoring. Each loadout fills its marquee
// slots first (the 3-hole claims his man before the 6-hole gets a vote),
// then hands the leftovers to the back of the order by overall bat quality.
// Rivals don't get a choice: their club identity (team trait) IS their
// philosophy, so the sluggers' club stacks bombers and the smallball club
// leads off with its burner.

import { eff } from "./gear.js";

// The original auto-sort formula — kept as its own philosophy
const bat = (q) => q.contact + q.eye + q.power * 0.7 + q.speed * 0.3;
const onBase = (q) => q.eye * 1.2 + q.contact * 0.6 + q.speed * 0.3;
const table = (q) => q.speed + q.eye * 0.8 + q.contact * 0.5;
const clutchBonus = (p) => (p.trait === "clutch" ? 25 : 0);

// slots: fill-priority order; `at` is the lineup index (0-8) the pick lands in
export const LOADOUTS = [
  {
    id: "numbers", name: "BY THE NUMBERS", blurb: "Best bats up top, no romance.",
    slots: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((at) => ({ at, score: bat })),
  },
  {
    id: "oldSchool", name: "OLD SCHOOL", blurb: "Three best hitter, cleanup power, speed leads off.",
    slots: [
      { at: 2, score: (q) => q.contact + q.power + q.eye },
      { at: 3, score: (q) => q.power * 1.4 + q.contact * 0.4 },
      { at: 0, score: table },
      { at: 1, score: (q) => q.contact + q.eye * 0.8 },
      { at: 4, score: (q) => q.power + q.contact * 0.5 },
      ...[5, 6, 7, 8].map((at) => ({ at, score: bat })),
    ],
  },
  {
    id: "power", name: "MURDERERS' ROW", blurb: "Sluggers stacked 2 through 5. Pray for wind.",
    slots: [
      { at: 1, score: (q) => q.power },
      { at: 2, score: (q) => q.power },
      { at: 3, score: (q) => q.power },
      { at: 4, score: (q) => q.power },
      { at: 0, score: onBase },
      ...[5, 6, 7, 8].map((at) => ({ at, score: bat })),
    ],
  },
  {
    id: "smallball", name: "TABLE SETTERS", blurb: "Speed and eyes up front, contact to cash them in.",
    slots: [
      { at: 0, score: table },
      { at: 1, score: table },
      { at: 2, score: (q) => q.contact * 1.3 + q.eye * 0.5 },
      { at: 3, score: (q) => q.contact + q.power * 0.6 },
      { at: 4, score: (q) => q.contact + q.power * 0.4 },
      ...[5, 6, 7, 8].map((at) => ({ at, score: bat })),
    ],
  },
  {
    id: "rally", name: "RALLY ENGINE", blurb: "Walks up front, clutch bats behind them.",
    slots: [
      { at: 0, score: onBase },
      { at: 1, score: onBase },
      { at: 2, score: onBase },
      { at: 3, score: (q, p) => q.power + q.contact * 0.4 + clutchBonus(p) },
      { at: 4, score: (q, p) => q.power * 0.8 + q.contact * 0.5 + clutchBonus(p) },
      { at: 5, score: (q, p) => bat(q) * 0.5 + clutchBonus(p) },
      ...[6, 7, 8].map((at) => ({ at, score: bat })),
    ],
  },
];

export const loadoutById = (id) => LOADOUTS.find((l) => l.id === id) || null;

// Greedy slot assignment: marquee slots pick first from whoever's left
export const applyLoadout = (batters, id) => {
  const plan = loadoutById(id);
  if (!plan) return batters;
  const pool = [...batters];
  const order = new Array(9).fill(null);
  for (const { at, score } of plan.slots) {
    if (!pool.length) break;
    let best = 0, bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const s = score(eff(pool[i]), pool[i]);
      if (s > bestScore) { bestScore = s; best = i; }
    }
    order[at] = pool.splice(best, 1)[0];
  }
  // paranoia: any unfilled slot takes the next leftover
  for (let i = 0; i < 9; i++) if (!order[i] && pool.length) order[i] = pool.shift();
  return order;
};

// A rival's philosophy follows its club identity — permanent, no save field
const TRAIT_LOADOUT = {
  sluggers: "power",
  smallball: "smallball",
  patient: "rally",
  aces: "oldSchool",
  gloves: "oldSchool",
  balanced: "numbers",
};
export const rivalLoadout = (traitId) => TRAIT_LOADOUT[traitId] || "numbers";

// Sort a rival's batters in place per its philosophy (mutates the team)
export const sortRival = (team) => {
  team.batters = applyLoadout(team.batters, rivalLoadout(team.traitId));
  return team;
};
