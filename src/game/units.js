// ── Team report: five unit ratings, league ranks and a slot-by-slot depth chart ──
// Everything is measured with gear and traits counted (effective stats) and
// compared against the seven rival clubs. Pure.

import { eff, ovr } from "./gear.js";
import { slotOf, PEN } from "./roster.js";

export const UNITS = [
  { id: "hit", label: "Hitting", blurb: "contact and eye" },
  { id: "power", label: "Power", blurb: "lineup power" },
  { id: "field", label: "Speed & defense", blurb: "legs and gloves" },
  { id: "rotation", label: "Rotation", blurb: "the five starters" },
  { id: "pen", label: "Bullpen", blurb: "setup man and closer" },
];
export const unitLabel = (id) => UNITS.find((u) => u.id === id)?.label ?? id;

const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
const arms = (t) => [...(t.rotation || []), ...(t.pen || [])];

// A player's own score inside a unit (null when he isn't part of it)
export function playerUnitScore(team, p, unit) {
  const e = eff(p);
  const bat = p.role === "bat";
  if (unit === "hit") return bat ? (e.contact + e.eye) / 2 : null;
  if (unit === "power") return bat ? e.power : null;
  if (unit === "field") return bat ? (e.speed + e.defense) / 2 : null;
  if (unit === "rotation") return team.rotation.some((x) => x.id === p.id) ? ovr(p) : null;
  if (unit === "pen") return team.pen.some((x) => x.id === p.id) ? ovr(p) : null;
  return null;
}

// The five numbers for any club
export function unitRatings(team) {
  const bats = team.batters.map(eff);
  const armDef = mean(arms(team).map((p) => eff(p).defense ?? 0));
  const batField = mean(bats.map((e) => (e.speed + e.defense) / 2));
  return {
    hit: mean(bats.map((e) => (e.contact + e.eye) / 2)),
    power: mean(bats.map((e) => e.power)),
    // the nine fielders carry the defense; the staff's gloves count a little
    field: arms(team).length ? batField * 0.85 + armDef * 0.15 : batField,
    rotation: mean((team.rotation || []).map(ovr)),
    pen: mean((team.pen || []).map(ovr)),
  };
}

const rankOf = (mine, all) => 1 + all.filter((v) => v > mine + 1e-9).length;

// For each unit: your rating, rank of 8, league average, gap, the league's best and your weakest player there
export function unitReport(s) {
  if (!s.roster || !s.rivals) return [];
  const me = unitRatings(s.roster);
  const rivals = s.rivals.map((t) => ({ name: t.name, u: unitRatings(t) }));
  return UNITS.map((unit) => {
    const all = [me[unit.id], ...rivals.map((r) => r.u[unit.id])];
    const avg = mean(all);
    const top = rivals.reduce((a, b) => (b.u[unit.id] > a.u[unit.id] ? b : a));
    const bestMine = me[unit.id] >= top.u[unit.id];
    const players = [...s.roster.batters, ...arms(s.roster)]
      .map((p) => ({ p, score: playerUnitScore(s.roster, p, unit.id) }))
      .filter((x) => x.score != null)
      .sort((a, b) => a.score - b.score);
    const weak = players[0] || null;
    return {
      ...unit, rating: me[unit.id], rank: rankOf(me[unit.id], all), of: all.length, avg, gap: me[unit.id] - avg,
      best: bestMine ? me[unit.id] : top.u[unit.id], bestClub: bestMine ? null : top.name,
      weakest: weak ? { id: weak.p.id, name: weak.p.name, slot: slotOf(s.roster, weak.p.id), score: weak.score } : null,
      start: s.unitsStart?.[unit.id] ?? null,
    };
  });
}

const ord = (n) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`;

// The unit furthest below the league, with a pointer to the man holding it back
export function weakestLink(s) {
  const rep = unitReport(s);
  if (!rep.length) return null;
  const worst = rep.reduce((a, b) => (b.gap < a.gap ? b : a));
  const best = rep.reduce((a, b) => (b.gap > a.gap ? b : a));
  const w = worst.weakest;
  const text = worst.gap >= 0
    ? `Every unit is at or above the league average. Thinnest margin: ${worst.label} (${ord(worst.rank)} of ${worst.of}).`
    : `${worst.label} is ${ord(worst.rank)} of ${worst.of}, ${Math.abs(worst.gap).toFixed(1)} below the league average.${w ? ` Weakest there: ${w.slot} ${w.name} (${w.score.toFixed(0)}).` : ""}`;
  return { worst, best, text, short: `Strongest: ${best.label} (${ord(best.rank)}). Weakest: ${worst.label} (${ord(worst.rank)}).` };
}

// Each of your 16 slots against the same slot on the other seven clubs
export function depthChart(s) {
  if (!s.roster || !s.rivals) return [];
  const byOvr = (list) => [...list].sort((a, b) => ovr(b) - ovr(a));
  const rows = [];
  const add = (slot, group, p, theirs) => {
    const mine = ovr(p);
    const all = [mine, ...theirs];
    rows.push({ slot, group, id: p.id, name: p.name, ovr: mine, rank: rankOf(mine, all), of: all.length, avg: mean(all), gap: mine - mean(all) });
  };
  for (const p of s.roster.batters) {
    add(p.pos, "Lineup", p, s.rivals.map((t) => t.batters.find((q) => q.pos === p.pos)).filter(Boolean).map(ovr));
  }
  // your SPn stands against each rival's n-th best starter
  s.roster.rotation.forEach((p, i) => add(`SP${i + 1}`, "Rotation", p, s.rivals.map((t) => byOvr(t.rotation)[i]).filter(Boolean).map(ovr)));
  s.roster.pen.forEach((p, i) => add(PEN[i], "Bullpen", p, s.rivals.map((t) => t.pen[i]).filter(Boolean).map(ovr)));
  return rows;
}
