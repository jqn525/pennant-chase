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

// The one and only league. Everything is tuned around its statBase.
export const LEAGUE = {
  name: "The Bigs",
  statBase: 6,
  innings: 9,
  seasonGames: 154, // 22 vs each of 7 rivals
  playoffTeams: 4,
  fenceCorner: 330,
  fenceCenter: 410,
  payWin: 60,    // legacy anchor: gear prices key off this
  fansPerWin: 8, // + 2 per HR, streaks multiply it
};

// The seven clubs you will battle forever
export const RIVAL_NAMES = ["River Cats", "Mudhens", "Growlers", "Steel", "Bisons", "Copperheads", "Night Owls"];

export const ECON = {
  startMoney: 200,
  startFans: 25,
  // Ticket sales: attendance = fans × (30% cold … 60% hot, by last-10 form),
  // capped; playoff games sell out. Gate = base + attendance × ticketPrice.
  ticketPrice: 0.11,
  gateWinBase: 45,   // winners sell concessions
  gateLossBase: 15,  // the diehards' floor
  attCap: 2500,      // biggest crowd the old yard can hold
  // Hot streaks: 3+ straight wins draw bandwagon fans, up to double growth
  streakStep: 0.15,
  streakMax: 2,
  playoffWinPay: 500,     // per playoff game won
  semisSeriesPay: 1500,   // winning a semifinal series
  cupPay: 10000,          // winning the Pennant Cup
  cupFans: 500,
  playoffFans: 150,       // made the playoffs (missed = -5% fans)
  merchCost: 150, merchFans: 200,
  tvCost: 2500, tvFans: 2500,
  offlineCapHours: 8,     // merch keeps selling while away, up to this
  offlineRate: 1.0,       // tunable damper on away income
  trainBase: 25,          // training cost = trainBase × 1.5^stat
};

// Rival offseason improvement: +1 stat bumps = CREEP.base + finishIndex (0=1st),
// +CREEP.cellarBonus extra for the last-place club. Standing still = falling behind.
// Rubber band: rivals trailing the PLAYER's rating gain up to rubberCap extra
// points (rubber × rating gap), so a dynasty gets hunted down within a few years.
export const CREEP = { base: 8, cellarBonus: 4, rubber: 8, rubberCap: 30 };

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
