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
  { id: "sluggers", label: "HR Sluggers", desc: "big power, thin averages", mod: { power: 12, contact: -8 } },
  { id: "gloves", label: "Defensive Wizards", desc: "weak bats, elite gloves", mod: { defense: 12, power: -8 } },
  { id: "smallball", label: "Small Ball", desc: "speed and contact, no pop", mod: { speed: 12, contact: 4, power: -12 } },
  { id: "aces", label: "Pitching Factory", desc: "nasty stuff on the mound", mod: { stuff: 12 } },
  { id: "patient", label: "Grinders", desc: "they work every count", mod: { eye: 12, power: -4 } },
  { id: "balanced", label: "Well Drilled", desc: "no weaknesses, no stars", mod: { contact: 4, defense: 4 } },
];

// The one and only league. Everything is tuned around its statBase.
export const LEAGUE = {
  name: "The Bigs",
  statBase: 65, // league-average rating on the 0-100 scale
  statCap: 99,  // nothing and no one passes 99
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
  trainBase: 6,           // training: cost per +1 = trainBase × 1.5^((stat−41)/4)
};

// Rival offseason improvement: +1 stat bumps = CREEP.base + finishIndex (0=1st),
// +CREEP.cellarBonus extra for the last-place club. Standing still = falling behind.
// Rubber band: rivals trailing the PLAYER's rating gain up to rubberCap extra
// points (rubber × rating gap), so a dynasty gets hunted down within a few years.
export const CREEP = { base: 8, cellarBonus: 4, rubber: 2, rubberCap: 30, bump: 4 };

// One per player — real engine effects, shown as a badge on the stat card
export const PLAYER_TRAITS = [
  { id: "clutch", label: "Clutch", desc: "Locks in with runners on — contact and eye rise", role: "bat" },
  { id: "freeSwinger", label: "Free Swinger", desc: "Swings for the seats: more homers, more strikeouts", role: "bat" },
  { id: "contactArtist", label: "Contact Artist", desc: "Puts everything in play — fewer whiffs, less pop", role: "bat" },
  { id: "glovework", label: "Glovework", desc: "Highlight-reel defense in the field", role: "bat" },
  { id: "burner", label: "Burner", desc: "Pure speed — stretches singles into doubles", role: "bat" },
  { id: "fireballer", label: "Fireballer", desc: "Nasty stuff, wobbly control", role: "pit" },
  { id: "painter", label: "Painter", desc: "Hits corners all day, lighter stuff", role: "pit" },
  { id: "iceman", label: "Iceman", desc: "Ice in the veins with runners aboard", role: "pit" },
  { id: "workhorse", label: "Workhorse", desc: "Goes deep into games before tiring", role: "pit" },
];

// Gear rarities: shipment weights and price anchors
export const RARITY = {
  1: { name: "COMMON", weight: 65, cost: 300, pct: 5 },
  2: { name: "RARE", weight: 28, cost: 900, pct: 10 },
  3: { name: "LEGENDARY", weight: 7, cost: 2100, pct: 15 },
};

// Trades: deterministic pricing — rivals charge a premium and buy at a discount
export const TRADE = { fee: 200, buyPremium: 1.6, sellDiscount: 0.5, valuePerOvr: 225 };

// Rookie draft: class size and signing-bonus scaling
export const DRAFT = { classSize: 5, signBase: 400, signPerPot: 38 };

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
