// ── Game data tables: colors, cities, leagues, traits, stat definitions ──

export const C = {
  green: "#152E22",
  greenPanel: "#1D3C2C",
  greenLine: "#2C5540",
  cream: "#F2EDDC",
  creamDim: "#B9B49F",
  amber: "#FFB627",
  red: "#D9584A",
  dirt: "#C89B6C",
  grass: "#7BC96F",
};

export const FIRST = ["Ace", "Dutch", "Lefty", "Mo", "Ry", "Cal", "Boog", "Vida", "Sal", "Iz", "Tuck", "Roxie", "Gus", "Pep", "Bo", "Nix", "Sky", "Duke", "Wren", "Marta"];
export const LAST = ["Delgado", "Okafor", "Marsh", "Ishida", "Kowalski", "Bell", "Fontaine", "Rojas", "Whitlock", "Nakamura", "Pryor", "Vance", "Otero", "Grimm", "Holloway", "Sato", "Reyes", "Byrd", "Castellan", "Mbeki"];

export const CITIES = [
  { name: "Sacramento", bonus: "fans", label: "Hungry market: +25% fan growth" },
  { name: "Nashville", bonus: "merch", label: "Merch city: merchandise pays +30%" },
  { name: "Portland", bonus: "train", label: "Player development hub: training costs -15%" },
  { name: "San Antonio", bonus: "gate", label: "Big gates: +25% game payouts" },
  { name: "Buffalo", bonus: "floor", label: "Loyal diehards: money floor doubled on losses" },
  { name: "Montreal", bonus: "fans", label: "Baseball-starved: +25% fan growth" },
];

export const TRAITS = [
  { id: "sluggers", label: "HR Sluggers", desc: "big power, thin averages", mod: { power: 3, contact: -2 } },
  { id: "gloves", label: "Defensive Wizards", desc: "weak bats, elite gloves", mod: { defense: 3, power: -2 } },
  { id: "smallball", label: "Small Ball", desc: "speed and contact, no pop", mod: { speed: 3, contact: 1, power: -3 } },
  { id: "aces", label: "Pitching Factory", desc: "nasty stuff on the mound", mod: { stuff: 3 } },
  { id: "patient", label: "Grinders", desc: "they work every count", mod: { eye: 3, power: -1 } },
  { id: "balanced", label: "Well Drilled", desc: "no weaknesses, no stars", mod: { contact: 1, defense: 1 } },
];

export const OPP_NAMES = ["River Cats", "Mudhens", "Growlers", "Sock Puppets", "Steel", "Bisons", "Comets", "Sandgnats", "Thunderheads", "Ospreys", "Copperheads", "Night Owls"];

export const LEAGUES = [
  { name: "Little League", statBase: 2, winsNeeded: 3, payWin: 25, payFloor: 8, fansPerWin: 12, innings: 3, fenceCorner: 130, fenceCenter: 175 },
  { name: "High School Ball", statBase: 4, winsNeeded: 4, payWin: 60, payFloor: 20, fansPerWin: 30, innings: 3, fenceCorner: 190, fenceCenter: 250 },
  { name: "Single-A", statBase: 7, winsNeeded: 5, payWin: 160, payFloor: 55, fansPerWin: 70, innings: 5, fenceCorner: 270, fenceCenter: 340 },
  { name: "Triple-A", statBase: 10, winsNeeded: 6, payWin: 420, payFloor: 140, fansPerWin: 160, innings: 5, fenceCorner: 315, fenceCenter: 390 },
  { name: "Major League", statBase: 14, winsNeeded: 8, payWin: 1100, payFloor: 350, fansPerWin: 420, innings: 7, fenceCorner: 330, fenceCenter: 410 },
];

export const POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
export const BAT_STATS = ["contact", "power", "eye", "speed", "defense"];
export const PIT_STATS = ["stuff", "control", "stamina", "defense"];
export const STAT_INFO = {
  contact: "Hit chance on any swing",
  power: "Exit distance; drives extra-base hits and homers",
  eye: "Walk chance; avoids strikeouts a little",
  speed: "Stretching hits, taking extra bases",
  defense: "Chance to convert balls in their zone into outs",
  stuff: "Strikeout chance against enemy batters",
  control: "Suppresses walks",
  stamina: "Batters faced before tiring (reliever enters)",
};
