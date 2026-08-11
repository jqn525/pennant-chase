// ── The pitch: visual flavor only ──
// The sim still decides a plate appearance in one roll; this module invents
// the pitch you SEE — what left the hand, where it crossed (or missed) the
// zone. A Flamethrower pounds heat, a Crafty arm lives on benders, and the
// put-away pitch on a strikeout matches the man throwing it.

export const PITCH_KINDS = ["fastball", "slider", "curveball", "changeup"];

// Mix by trait: [FB, SL, CU, CH] weights
const MIXES = {
  fireballer: [65, 15, 10, 10],
  painter: [25, 25, 30, 20],
  default: [45, 20, 20, 15],
};

const draw = (weights) => {
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return PITCH_KINDS[i]; }
  return "fastball";
};

// outcomeType is resolveAtBat's out.type (K | BB | ...) — presentation only
export const makePitch = (pitcher, outcomeType) => {
  const res = outcomeType === "K" ? "k" : outcomeType === "BB" ? "bb" : "play";
  let kind;
  if (res === "k" && Math.random() < 0.6) {
    // the put-away pitch: heat from the flamethrower, a bender from everyone else
    kind = pitcher.trait === "fireballer" ? "fastball" : Math.random() < 0.5 ? "curveball" : "slider";
  } else {
    kind = draw(MIXES[pitcher.trait] || MIXES.default);
  }
  // Plate crossing in feet (x lateral, y height). Strikes live in the zone;
  // a walk's final pitch misses wide or high; a wild one is anyone's guess.
  let px, py;
  if (res === "bb") {
    if (Math.random() < 0.6) { px = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random()); py = 2 + Math.random() * 1.5; }
    else { px = (Math.random() * 2 - 1) * 1.2; py = 4.4 + Math.random(); }
  } else {
    px = (Math.random() * 2 - 1) * 0.7;
    py = 1.8 + Math.random() * 1.4;
  }
  return { kind, res, px, py };
};

export const makeWildPitch = () => ({
  kind: Math.random() < 0.5 ? "fastball" : "curveball",
  res: "wild",
  px: (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2),
  py: 4.5 + Math.random() * 2,
});
