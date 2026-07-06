// ── The batted-ball engine ──
// Returns a rich outcome object; caller applies it to game state.
// All skill effects are measured RELATIVE to the league's statBase, so a
// player who is +2 above his league plays like a star at every level, and
// every league produces realistic baseball numbers (BA ~.250-.290,
// K% rising as you climb, homers rare in Little League, common in the Show).

import { gauss } from "./utils.js";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function resolveAtBat(batter, pitcher, fielders, fence, base = 5) {
  const rel = (v) => v - base;
  const kChance = clamp(0.14 + base * 0.006 + rel(pitcher.stuff) * 0.030 - rel(batter.contact) * 0.020 - rel(batter.eye) * 0.008, 0.06, 0.5);
  const bbChance = clamp(0.085 + rel(batter.eye) * 0.022 - rel(pitcher.control) * 0.020, 0.02, 0.22);
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
        ? 0.34 + pow * 0.035 + gauss() * 0.6
        : 0.46 + base * 0.006 + pow * 0.04 + gauss() * 0.7;
    const dist = carry * fenceHere;

    if (launch !== "ground" && dist > fenceHere) {
      return { type: "HR", text: `CRUSHES it ${deg}° ${side}-${Math.abs(spray) < 12 ? "center" : "field"}, ${dist.toFixed(0)} ft — over the ${fenceHere.toFixed(0)}-ft fence, GONE!`, dist };
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
    // Low leagues field worse (kids boot balls) — more action, authentically.
    const catchBase = launch === "ground" ? (infield ? 0.78 : 0.45) : launch === "fly" ? (infield ? 0.93 : 0.82) : 0.32;
    const catchChance = clamp(catchBase - (14 - base) * 0.007 + rel(fielder.defense) * 0.025 - rel(batter.contact) * 0.022, 0.05, 0.97);
    const desc = launch === "ground" ? "grounder" : launch === "liner" ? "sharp liner" : "fly ball";

    if (Math.random() < catchChance) {
      return { type: "OUT", text: `hits a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${fielder.name} (${fielderPos}) makes the play.` };
    }

    // It's a hit. Bases from depth + speed.
    const spd = rel(batter.speed);
    const deep = dist > fenceHere * 0.78;
    const gapper = dist > fenceHere * 0.6 && launch !== "ground";
    let bases = 1;
    if (deep && Math.random() < 0.14 + spd * 0.04) bases = 3;
    else if ((gapper && Math.random() < 0.7) || Math.random() < 0.05 + spd * 0.02) bases = 2;
    const call = bases === 3 ? "it rolls to the wall — TRIPLE!" : bases === 2 ? `past ${fielder.name} — stand-up double.` : `drops in front of ${fielder.name} (${fielderPos}) for a single.`;
    return { type: "HIT", bases, text: `laces a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${call}`, dist };
  }
  return { type: "OUT", text: `fouls off a third straight pitch, then pops out to the catcher.` };
}
