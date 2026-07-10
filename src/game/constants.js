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

export const FIRST = [
  "Ace", "Dutch", "Lefty", "Mo", "Ry", "Cal", "Boog", "Vida", "Sal", "Iz",
  "Tuck", "Roxie", "Gus", "Pep", "Bo", "Nix", "Sky", "Duke", "Wren", "Marta",
  "Amos", "Arch", "Augie", "Bing", "Birdie", "Brooks", "Buck", "Bump", "Buzz", "Chick",
  "Cookie", "Cy", "Dazzy", "Denny", "Dizzy", "Dock", "Enos", "Ernie", "Felix", "Flip",
  "Gabby", "Gil", "Goose", "Hank", "Heinie", "Hoyt", "Hub", "Ike", "Jake", "Kiki",
  "Lem", "Lou", "Luke", "Mack", "Monte", "Moose", "Mule", "Nap", "Nellie", "Ossie",
  "Otto", "Pancho", "Preacher", "Rabbit", "Red", "Rip", "Rollie", "Rube", "Rusty", "Scooter",
  "Skeeter", "Slim", "Smoky", "Sparky", "Stretch", "Stu", "Tex", "Tito", "Turk", "Vern",
  "Vic", "Wally", "Wilbur", "Zack", "Zeke", "Blue", "Burl", "Cletus", "Harmon", "Lee",
];
export const LAST = [
  "Delgado", "Okafor", "Marsh", "Ishida", "Kowalski", "Bell", "Fontaine", "Rojas", "Whitlock", "Nakamura",
  "Pryor", "Vance", "Otero", "Grimm", "Holloway", "Sato", "Reyes", "Byrd", "Castellan", "Mbeki",
  "Abernathy", "Arroyo", "Baines", "Baxter", "Bigelow", "Blackwood", "Bonilla", "Briggs", "Calloway", "Campos",
  "Cardenas", "Carver", "Chapman", "Crowder", "Cruz", "DeLuca", "Diggs", "Dombrowski", "Duffy", "Eastman",
  "Espinoza", "Farrell", "Fenwick", "Fielder", "Flores", "Fujimoto", "Gaines", "Galloway", "Garza", "Gibbs",
  "Goodwin", "Granger", "Guerrero", "Gutierrez", "Hargrove", "Hatcher", "Hidalgo", "Higgins", "Hollis", "Huxley",
  "Ibarra", "Jenkins", "Kessler", "Kimura", "Kirkland", "Lachance", "Lattimore", "LeBlanc", "Lockhart", "Lozano",
  "Maddox", "Marchetti", "Matsuda", "McAllister", "Mercado", "Molina", "Montoya", "Mudd", "Nash", "Nieves",
  "Nomura", "Ojeda", "Okada", "Ortega", "Osei", "Paredes", "Peralta", "Pettibone", "Quintana", "Rafferty",
  "Renteria", "Rhodes", "Ruiz", "Salazar", "Sandoval", "Schmidt", "Segura", "Serrano", "Slocum", "Stroud",
  "Sweeney", "Takahashi", "Tavares", "Thorne", "Urbina", "Valdez", "Vasquez", "Ventura", "Villanueva", "Watkins",
  "Webb", "Whitaker", "Wilks", "Yamada", "Zamora",
];

// Club edges — pick one at founding (the old per-city bonuses, city-neutral)
export const EDGES = [
  { bonus: "fans", title: "HUNGRY MARKET", label: "+25% fan growth" },
  { bonus: "merch", title: "MERCH TOWN", label: "merchandise pays +30%" },
  { bonus: "train", title: "DEV ACADEMY", label: "training costs -15%" },
  { bonus: "gate", title: "BIG GATES", label: "+25% game payouts" },
  { bonus: "floor", title: "DIEHARDS", label: "loss payouts doubled" },
];

// Team identity pools: minor-league flavored towns and nicknames
export const CITY_POOL = [
  "Toledo", "Fresno", "Duluth", "Butte", "Amarillo", "Pawtucket", "Chattanooga", "Spokane",
  "Port Vale", "Cedar Falls", "Bison Ridge", "Sable Creek", "Harbor City", "Yucca Flats",
  "Iron Bend", "Dry Gulch", "Millhaven", "Oak Hollow", "Red Mesa", "Saltwater",
  "Gravel Point", "Copper Junction", "Twin Forks", "Palmetto", "Frostburg", "El Dorado",
  "Kingsport", "Blue Ash", "Tarrytown", "Mudflat", "Sunbury", "Cannon Falls",
  "Whistler's Gap", "Bakersfield", "Owl Creek", "Rock Bottom", "Grover's Mill", "Lantern Hill",
];
export const NICKNAME_POOL = [
  "River Cats", "Mudhens", "Growlers", "Steel", "Bisons", "Copperheads", "Night Owls",
  "Sandpipers", "Mudcats", "Ironbirds", "Thunderclaps", "Dusters", "Wolf Spiders", "Sod Busters",
  "Haymakers", "Zephyrs", "Jackalopes", "Stevedores", "Linemen", "Moonshots",
  "Prairie Dogs", "Green Sox", "Wranglers", "Coal Skinks", "Barnstormers", "Dirigibles",
  "Leadoffs", "Spitfires", "Turkeys", "Cannoneers", "Swamp Foxes", "Boilermen",
  "Knuckleballs", "Sluggos", "Rainmakers", "Longhorns", "Icehouse Cats", "Ragtops",
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
  offlineRate: 1.0,       // tunable damper on away income
  trainBase: 6,           // training: cost per +1 = trainBase × 1.5^((stat−41)/4)
};

// Stadium upgrades: four tracks, three tiers each, gated by money + fan milestones.
// value semantics — parking: attendance-rate bonus; seats: new attendance cap;
// conc: gate multiplier bonus; lights: win fan-growth multiplier.
export const STADIUM = [
  {
    id: "parking", title: "PARKING", tiers: [
      { name: "Gravel Lot", cost: 1500, fans: 300, label: "+5% attendance", value: 0.05 },
      { name: "Paved Lot", cost: 4000, fans: 1000, label: "+10% attendance", value: 0.10 },
      { name: "Parking Garage", cost: 10000, fans: 2500, label: "+15% attendance", value: 0.15 },
    ],
  },
  {
    id: "seats", title: "SEATS", tiers: [
      { name: "Bleachers", cost: 3000, fans: 2000, label: "holds 4,000", value: 4000 },
      { name: "Grandstand", cost: 8000, fans: 3500, label: "holds 6,500", value: 6500 },
      { name: "Upper Deck", cost: 20000, fans: 6000, label: "holds 10,000", value: 10000 },
    ],
  },
  {
    id: "conc", title: "CONCESSIONS", tiers: [
      { name: "Hot Dog Cart", cost: 1200, fans: 200, label: "+15% gate", value: 0.15 },
      { name: "Food Court", cost: 3500, fans: 800, label: "+30% gate", value: 0.30 },
      { name: "Restaurant Row", cost: 9000, fans: 2000, label: "+45% gate", value: 0.45 },
    ],
  },
  {
    id: "lights", title: "LIGHTS", tiers: [
      { name: "Floodlights", cost: 1000, fans: 150, label: "+10% fan growth", value: 0.10 },
      { name: "Full Rig", cost: 3000, fans: 600, label: "+25% fan growth", value: 0.25 },
      { name: "Prime Time", cost: 8000, fans: 1500, label: "+50% fan growth", value: 0.50 },
    ],
  },
];

// Revenue streams, tiered like the stadium. MERCH multiplies jersey sales and
// extends how long the store sells while you're away; MEDIA multiplies all
// passive income (tier 1 of each is the original merch stand / TV deal).
export const REVENUE = [
  {
    id: "merch", title: "MERCH", tiers: [
      { name: "Merch Stand", cost: 150, fans: 200, label: "jersey sales · away 8h", value: 1, offline: 8 },
      { name: "Team Store", cost: 1500, fans: 1000, label: "sales +75% · away 12h", value: 1.75, offline: 12 },
      { name: "Flagship Store", cost: 6000, fans: 3000, label: "sales +150% · away 24h", value: 2.5, offline: 24 },
    ],
  },
  {
    id: "tv", title: "MEDIA", tiers: [
      { name: "Regional TV", cost: 2500, fans: 2500, label: "sales ×2", value: 2 },
      { name: "National TV", cost: 8000, fans: 5000, label: "sales ×3", value: 3 },
      { name: "Coast-to-Coast", cost: 20000, fans: 8000, label: "sales ×4", value: 4 },
    ],
  },
];

// Current revenue effects for merch/tv levels (0-3 each)
export const revenueFx = (merchLvl = 0, tvLvl = 0) => ({
  merchMult: merchLvl ? REVENUE[0].tiers[merchLvl - 1].value : 0,
  tvMult: tvLvl ? REVENUE[1].tiers[tvLvl - 1].value : 1,
  offlineHours: merchLvl ? REVENUE[0].tiers[merchLvl - 1].offline : 0,
});

// Current stadium effects for a levels object like {parking:0..3, seats:0..3, ...}
export const stadiumFx = (levels = {}) => {
  const tier = (id) => {
    const lvl = levels[id] || 0;
    return lvl ? STADIUM.find((t) => t.id === id).tiers[lvl - 1].value : 0;
  };
  return {
    attCap: tier("seats") || ECON.attCap,
    rateBonus: tier("parking"),
    gateMult: 1 + tier("conc"),
    fansMult: 1 + tier("lights"),
  };
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
