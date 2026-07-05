// ── The batted-ball engine ──
// Returns a rich outcome object; caller applies it to game state.

import { gauss } from "./utils.js";

export function resolveAtBat(batter, pitcher, fielders, fence) {
  const kChance = Math.min(0.55, Math.max(0.05, 0.10 + pitcher.stuff * 0.018 - batter.contact * 0.011 - batter.eye * 0.003));
  const bbChance = Math.min(0.3, Math.max(0.02, 0.05 + batter.eye * 0.014 - pitcher.control * 0.010));
  const r = Math.random();
  if (r < kChance) return { type: "K", text: `strikes out swinging.` };
  if (r < kChance + bbChance) return { type: "BB", text: `works a walk.` };

  // Ball in play — up to 3 foul re-rolls
  for (let attempt = 0; attempt < 3; attempt++) {
    // Spray angle: 0 = dead center, -45/+45 = foul lines. Pull skews it.
    const spray = (gauss() * 2 - 1) * 55 + batter.pull * 18;
    // Launch profile
    const lr = Math.random();
    const launch = lr < 0.38 ? "ground" : lr < 0.7 ? "liner" : "fly";
    // Distance from power
    const pow = batter.power;
    const dist = launch === "ground"
      ? 40 + gauss() * 110
      : launch === "liner"
        ? 70 + pow * 11 + gauss() * 90
        : 90 + pow * 13 + gauss() * 110;

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

    // Fair ball. Fence distance at this angle (shallow at corners, deep in center)
    const fenceHere = fence.center - (fence.center - fence.corner) * (Math.abs(spray) / 45);
    if (launch !== "ground" && dist > fenceHere) {
      return { type: "HR", text: `CRUSHES it ${deg}° ${side}-${Math.abs(spray) < 12 ? "center" : "field"}, ${dist.toFixed(0)} ft — over the ${fenceHere.toFixed(0)}-ft fence, GONE!`, dist };
    }

    // Pick the responsible fielder by zone
    const infield = dist < fenceHere * 0.45;
    let fielderPos;
    if (infield) {
      fielderPos = spray < -22 ? "3B" : spray < -4 ? "SS" : spray < 14 ? "2B" : "1B";
      if (dist < 55) fielderPos = Math.random() < 0.5 ? "C" : fielderPos;
    } else {
      fielderPos = spray < -15 ? "LF" : spray < 15 ? "CF" : "RF";
    }
    const fielder = fielders.find((f) => f.pos === fielderPos) || fielders[0];

    const catchBase = launch === "ground" ? (infield ? 0.58 : 0.1) : launch === "fly" ? (infield ? 0.75 : 0.5) : 0.24;
    const catchChance = Math.min(0.95, catchBase + fielder.defense * 0.03);
    const desc = launch === "ground" ? "grounder" : launch === "liner" ? "sharp liner" : "fly ball";

    if (Math.random() < catchChance) {
      return { type: "OUT", text: `hits a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${fielder.name} (${fielderPos}) makes the play.` };
    }

    // It's a hit. Bases from depth + speed.
    const deep = dist > fenceHere * 0.72;
    const gapper = dist > fenceHere * 0.58 && launch !== "ground";
    let bases = 1;
    if (deep && Math.random() < 0.35 + batter.speed * 0.03) bases = 3;
    else if (gapper || Math.random() < batter.speed * 0.02) bases = 2;
    const call = bases === 3 ? "it rolls to the wall — TRIPLE!" : bases === 2 ? `past ${fielder.name} — stand-up double.` : `drops in front of ${fielder.name} (${fielderPos}) for a single.`;
    return { type: "HIT", bases, text: `laces a ${desc} ${deg}° ${side}, ${dist.toFixed(0)} ft — ${call}`, dist };
  }
  return { type: "OUT", text: `fouls off a third straight pitch, then pops out to the catcher.` };
}
