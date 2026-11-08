// ── Progressive unlocks: systems appear as they start to matter ──
// Pure. s.unlocked is the list of ids opened so far; null means "everything"
// (saves from before unlocks existed, and test fixtures).

import { ovr } from "./gear.js";

const games = (s) => s.hist?.n ?? 0;
const players = (s) => (s.roster ? [...s.roster.batters, ...s.roster.rotation, ...s.roster.pen] : []);

export const UNLOCKS = [
  { id: "gear", when: (s) => games(s) >= 3, news: "A gear dealer starts calling. Shipments of bats, gloves and cleats arrive every series." },
  { id: "records", when: (s) => games(s) >= 5, news: "The club starts keeping a record book." },
  { id: "autodev", when: (s) => games(s) >= 5, news: "A development coach joins the staff. Training and gear can now run on autopilot." },
  { id: "ballpark", when: (s) => s.fans >= 1200 || games(s) >= 8, news: "The town is talking about the club. Time to think about the ballpark." },
  { id: "stats-money", when: (s) => games(s) >= 10, news: "The accountant hands over the first money charts." },
  { id: "stats-players", when: (s) => games(s) >= 10, news: "Scouts start tracking every player's development." },
  { id: "stats-roi", when: (s) => (s.hist?.spend.length ?? 0) > 0, news: null },
  { id: "projections", when: (s) => games(s) >= 20, news: "The analytics department opens: playoff odds and season projections." },
  { id: "star", when: (s) => players(s).some((p) => ovr(p) >= 70), news: "One of your players is getting noticed. Star-power promotions are open." },
  { id: "trades", when: (s) => games(s) >= 30 || s.year >= 2, news: "Rival general managers start taking your calls. Trades are open." },
];

export const isOpen = (s, id) => s.unlocked == null || s.unlocked.includes(id);

// Open anything newly reached; returns the unlocks that just opened
export function checkUnlocks(s) {
  if (s.unlocked == null || !s.city) return [];
  const fresh = UNLOCKS.filter((u) => !s.unlocked.includes(u.id) && u.when(s));
  if (fresh.length) s.unlocked = [...s.unlocked, ...fresh.map((u) => u.id)];
  return fresh;
}

// What opens next, for teasers
export const nextUnlockNote = {
  gear: "Gear shipments start after game 3.",
  autodev: "A development coach joins after game 5.",
  ballpark: "The ballpark opens up at 1,200 fans or after game 8.",
  star: "Star power opens when a player reaches 70 overall.",
  trades: "Trades open after game 30.",
  projections: "Projections open after game 20.",
};
