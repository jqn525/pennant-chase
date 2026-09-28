// ── The one palette: every pixel in the game comes from this table ──
// Built around the club colors in C (constants.js). Sprites reference colors
// by a single character key; team and skin slots are swapped per actor.

export const PAL = {
  // outline + neutrals
  k: "#0b1510", // outline
  K: "#1f2a24", // soft outline / deep shadow
  w: "#f5edda", // cream (home uniform, chalk)
  W: "#c9bfa4", // cream shadow
  // team slots (swapped): cap + trim
  c: "#e9a431",
  C: "#a8701c",
  // skin slots (swapped)
  s: "#e8b88f",
  S: "#c08a62",
  // leather + wood
  b: "#8a5a2b", // glove
  B: "#5e3a1a",
  t: "#e0bd84", // bat
  // misc
  r: "#c6503f",
  a: "#e9a431",
  y: "#fff4c9",
  e: "#1a120c", // eyes / hair dark
  // hair slots (swapped per player)
  h: "#3a2616",
  H: "#24170d",
  m: "#8e3b30", // mouth
  n: "#5a6660", // catcher's gear
  N: "#3a4540",
  // portrait backdrop: a night ballpark, out of focus
  g: "#1d3c2c",
  G: "#132b1f",
  L: "#2c5540",
  l: "#e9a431",
  // gear accents
  x: "#b9b49f",
  X: "#7d7a6a",
};

export const HAIR = [
  ["#1a120c", "#0b0806"],
  ["#3a2616", "#24170d"],
  ["#6b4326", "#4a2d18"],
  ["#9a4a24", "#6b3016"],
  ["#d9b060", "#a8843c"],
  ["#9a9a90", "#6e6e66"],
];

// Park + effects colors (used directly by the scene renderer)
export const PARK = {
  sky0: "#060f0b", sky1: "#0a1a12", sky2: "#0d2418", star: "#f5edda",
  grassA: "#3c8a47", grassB: "#337a3e", grassEdge: "#2a6536", foul: "#245a30",
  dirt: "#b07a4a", dirtDark: "#936238", track: "#8a5c36",
  chalk: "#f5edda", base: "#ffffff",
  wall: "#1d3c2c", wallDark: "#132b1f", wallTop: "#e9a431", pad: "#2c5540",
  stand0: "#16271f", stand1: "#1d3228", standRail: "#2f4a3b",
  pole: "#34443c", lamp: "#fff4c9", glow: "#e9a431",
  shadow: "#0b1510",
  ball: "#ffffff",
  mark: { hr: "#e9a431", hit: "#f5edda", err: "#c6503f", out: "#0f2a1a" },
  board: "#0b1510", boardFrame: "#bd7b21", boardText: "#e9a431", boardDim: "#4a3a1c",
};

// Crowd shirt colors — a warm, cohesive spread
export const CROWD = ["#c6503f", "#e9a431", "#f5edda", "#4f78a8", "#7a5a9a", "#3c8a47", "#d98e5a", "#b9b49f", "#2f5f8a", "#8e3b30"];

export const SKINS = [
  ["#f2cda5", "#cf9f78"],
  ["#e0ac7e", "#b98357"],
  ["#c18656", "#95613a"],
  ["#95613a", "#6e4426"],
  ["#6b4328", "#4b2d19"],
];

// Team color pairs [main, dark]. Ours is amber (club brand); opponents are
// assigned deterministically from their name.
export const US_TEAM = ["#e9a431", "#a8701c"];
export const OPP_TEAMS = [
  ["#c6503f", "#86302a"],
  ["#4f78a8", "#2d4c72"],
  ["#7a5a9a", "#4e3868"],
  ["#2f9a8a", "#1d6258"],
  ["#d9743a", "#9a4a20"],
  ["#3a3f4a", "#1f232b"],
  ["#a83a6a", "#6e2244"],
  ["#5a8a3a", "#385a22"],
];

// Away uniforms are road grey; home whites are cream.
export const ROAD = ["#b3b8b0", "#868c84"];
export const HOME = ["#f5edda", "#c9bfa4"];

export const hashStr = (s = "") => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const teamColors = (name) => OPP_TEAMS[hashStr(name) % OPP_TEAMS.length];
export const skinFor = (id = 0) => SKINS[(hashStr(String(id)) >>> 3) % SKINS.length];

// Build a swap map for an actor: team colors, uniform (home/road), skin.
export const swapFor = ({ team, home, skin }) => ({
  c: team[0], C: team[1],
  w: (home ? HOME : ROAD)[0], W: (home ? HOME : ROAD)[1],
  s: skin[0], S: skin[1],
});
