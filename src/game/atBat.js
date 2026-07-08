// ── The batted-ball engine ──
// Returns a rich outcome object; caller applies it to game state.
// All skill effects are measured RELATIVE to the league's statBase, so a
// player who is +2 above his league plays like a star at every level, and
// every league produces realistic baseball numbers (BA ~.250-.290,
// K% rising as you climb, homers rare in Little League, common in the Show).

import { gauss } from "./utils.js";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function resolveAtBat(batter, pitcher, fielders, fence, base = 5, sit = {}) {
  const rel = (v) => v - base;

  // Personality traits: situational and stylistic tweaks on top of raw stats
  const bT = batter.trait, pT = pitcher.trait;
  const clutchOn = bT === "clutch" && sit.runnersOn ? 1.5 : 0;
  const bContact = batter.contact + clutchOn;
  const bEye = batter.eye + clutchOn;
  const pStuff = pitcher.stuff
    + (pT === "fireballer" ? 1.5 : 0) + (pT === "painter" ? -1 : 0)
    + (pT === "iceman" && sit.runnersOn ? 1.5 : 0);
  const pControl = pitcher.control + (pT === "painter" ? 1.5 : 0) + (pT === "fireballer" ? -1 : 0);
  const kAdj = (bT === "freeSwinger" ? 0.035 : 0) + (bT === "contactArtist" ? -0.03 : 0);
  const carryAdj = (bT === "freeSwinger" ? 0.05 : 0) + (bT === "contactArtist" ? -0.04 : 0);

  const kChance = clamp(0.14 + base * 0.012 + rel(pStuff) * 0.030 - rel(bContact) * 0.020 - rel(bEye) * 0.008 + kAdj, 0.06, 0.5);
  const bbChance = clamp(0.085 + rel(bEye) * 0.022 - rel(pControl) * 0.020, 0.02, 0.22);
  const r = Math.random();
  if (r < kChance) return { type: "K", text: `strikes out swinging.` };
  if (r < kChance + bbChance) return { type: "BB", text: `works a walk.` };

  // Ball in play — up to 3 foul re-rolls
  for (let attempt = 0; attempt < 3; attempt++) {
    // Spray angle: 0 = dead center, -45/+45 = foul lines. Pull skews it.
    const spray = (gauss() * 2 - 1) * 55 + batter.pull * 18;
    // Launch profile
    const lr = Math.random();
    const launch = lr < 0.44 ? "ground" : lr < 0.68 ? "liner" : "fly";

    const side = spray < 0 ? "left" : "right";
    const deg = Math.abs(spray).toFixed(0);

    if (Math.abs(spray) > 45) {
      // Foul territory
      if (launch !== "ground" && Math.random() < 0.22) {
        const f = Math.abs(spray) > 50 ? "into the seats — but the corner man tracks it down" : "popped up in foul ground";
        return { type: "OUT", text: `lifts one ${deg}° ${side} — ${f}. Out.`, foulOut: true };
      }
      continue; // foul ball, swing again
    }

    // Fair ball. Fence distance at this angle (shallow at corners, deep in center).
    // Carry is a SHARE of the fence distance, so every park plays to scale.
    const fenceHere = fence.center - (fence.center - fence.corner) * (Math.abs(spray) / 45);
    const pow = rel(batter.power);
    const carry = launch === "ground"
      ? 0.12 + gauss() * 0.5
      : launch === "liner"
        ? 0.34 + carryAdj + pow * 0.035 + gauss() * 0.6
        : 0.46 + carryAdj + base * 0.006 + pow * 0.04 + gauss() * 0.7;
    const dist = carry * fenceHere;

    if (launch !== "ground" && dist > fenceHere) {
      return { type: "HR", text: `CRUSHES it ${deg}° ${side}-${Math.abs(spray) < 12 ? "center" : "field"}, ${dist.toFixed(0)} ft — over the ${fenceHere.toFixed(0)}-ft fence, GONE!`, spray, dist, launch };
    }

    // Pick the responsible fielder by zone
    const infield = dist < fenceHere * 0.45;
    let fielderPos;
    if (infield) {
      fielderPos = spray < -22 ? "3B" : spray < -4 ? "SS" : spray < 14 ? "2B" : "1B";
      if (dist < fenceHere * 0.2) fielderPos = Math.random() < 0.5 ? "C" : fielderPos;
    } else {
      fielderPos = spray < -15 ? "LF" : spray < 15 ? "CF" : "RF";
    }
    const fielder = fielders.find((f) => f.pos === fielderPos) || fielders[0];

    // Contact skill makes harder-to-field contact; defense converts chances.
    const fDef = fielder.defense + (fielder.trait === "glovework" ? 1.5 : 0);
    const catchBase = launch === "ground" ? (infield ? 0.78 : 0.45) : launch === "fly" ? (infield ? 0.93 : 0.82) : 0.32;
    const catchChance = clamp(catchBase + rel(fDef) * 0.025 - rel(bContact) * 0.022, 0.05, 0.97);
    const desc = launch === "ground" ? "grounder" : launch === "liner" ? "sharp liner" : "fly ball";

    if (Math.random() < catchChance) {
      // Even routine plays get booted now and then — sure hands boot fewer
      const errChance = clamp(0.025 - rel(fDef) * 0.006, 0.004, 0.07);
      if (Math.random() < errChance) {
        return { type: "E", text: `hits a ${desc} ${deg}° ${side} — ${fielder.name} (${fielderPos}) boots it! Error, everybody safe.`, spray, dist, launch };
      }
      // Ground ball, force at second, fewer than two outs: chance to turn two
      if (launch === "ground" && infield && sit.forceOn1 && sit.outs < 2) {
        const dpChance = clamp(0.5 + rel(fDef) * 0.03, 0.2, 0.8);
        if (Math.random() < dpChance) {
          return { type: "DP", text: `raps a grounder ${deg}° ${side} — ${fielder.name} (${fielderPos}) starts it, around the horn, TWO!`, spray, dist, launch };
        }
      }
      return { type: "OUT", text: `hits a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${fielder.name} (${fielderPos}) makes the play.`, spray, dist, launch };
    }

    // It's a hit. Bases from depth + speed.
    const spd = rel(batter.speed + (bT === "burner" ? 1.5 : 0));
    const deep = dist > fenceHere * 0.78;
    const gapper = dist > fenceHere * 0.6 && launch !== "ground";
    let bases = 1;
    if (deep && Math.random() < 0.14 + spd * 0.04) bases = 3;
    else if ((gapper && Math.random() < 0.7) || Math.random() < 0.05 + spd * 0.02) bases = 2;
    const call = bases === 3 ? "it rolls to the wall — TRIPLE!" : bases === 2 ? `past ${fielder.name} — stand-up double.` : `drops in front of ${fielder.name} (${fielderPos}) for a single.`;
    return { type: "HIT", bases, text: `laces a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${call}`, spray, dist, launch };
  }
  return { type: "OUT", text: `fouls off a third straight pitch, then pops out to the catcher.` };
}
