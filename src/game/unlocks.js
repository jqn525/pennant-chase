// ── Progressive unlocks: each system opens when you finish the step before it ──
// s.unlocked is the list of ids opened so far; null means "everything"
// (saves from before unlocks existed, and test fixtures).
// Steps with a `goal` are objectives the player is shown one at a time; each
// also opens after a number of games, so nobody gets stuck. The rest (stat
// pages) open quietly as the data to fill them arrives.

const games = (s) => s.hist?.n ?? 0;
const players = (s) => (s.roster ? [...s.roster.batters, ...s.roster.rotation, ...s.roster.pen] : []);
const spentOn = (s, cat) => (s.hist?.spend || []).some((e) => e.cat === cat);
const trained = (s) => (s.training?.lanes || []).some((l) => l.prog) || spentOn(s, "training");
const geared = (s) => spentOn(s, "gear") || players(s).some((p) => p.gear && Object.keys(p.gear).length > 0);
const wins = (s) => (s.year > 1 ? 99 : s.standings?.[0]?.w ?? 0);
const built = (s) => (s.merch || 0) + (s.tv || 0) + Object.values(s.stadium || {}).reduce((a, b) => a + (b || 0), 0) > 0;

export const UNLOCKS = [
  { id: "gear", goal: "Start a training program", how: "from the Buy list or any player's sheet", opens: "the gear dealer",
    when: (s) => trained(s) || games(s) >= 6, go: ["spend", "buy"], to: ["spend", "gear"],
    news: "A gear dealer starts calling. Shipments of bats, gloves and cleats arrive every series.",
    sheet: { title: "The gear dealer", body: "A shipment of bats, gloves and cleats now arrives every series. Each piece lifts one of a player's ratings, and the Buy list shows who it helps most." } },
  { id: "autodev", goal: "Equip a piece of gear", how: "buy one from the Buy list or Equipment", opens: "coaches on auto and an equipment manager",
    when: (s) => geared(s) || games(s) >= 12, go: ["spend", "gear"], to: ["spend", "coach"],
    news: "Your coaches can now run on auto, and an equipment manager joins to buy gear.",
    sheet: { title: "Coaches on auto", body: "Each coach can now pick the next training point himself whenever his lane frees up. An equipment manager will also buy gear from a share of each game's earnings. Switch either off to stay hands-on." } },
  { id: "lineup", goal: "Play 8 games", opens: "batting-order philosophies", progress: (s) => [games(s), 8],
    when: (s) => games(s) >= 8, to: ["roster"],
    news: "The manager asks how you want the batting order built.",
    sheet: { title: "Batting order", body: "Choose a philosophy for the batting order on the Roster tab, or set the order by hand. It is re-applied whenever the roster changes." } },
  { id: "ballpark", goal: "Win 5 games", opens: "ballpark construction", progress: (s) => [Math.min(5, wins(s)), 5],
    when: (s) => wins(s) >= 5 || games(s) >= 15, to: ["spend", "buy"],
    news: "The town is talking about the club. Time to think about the ballpark.",
    sheet: { title: "The ballpark", body: "You can now build: parking, seats, concessions, lights, a merch stand and later a TV deal. Projects take games to finish and are paid game by game, one per area at a time." } },
  { id: "report", goal: "Play 15 games", opens: "the team report and depth chart", progress: (s) => [games(s), 15],
    when: (s) => games(s) >= 15, to: ["roster"],
    news: "The scouting department files its first team report.",
    sheet: { title: "Team report", body: "The Roster tab now rates your hitting, power, speed and defense, rotation and bullpen against the league, and names the weakest link. Stats adds a depth chart for every position." } },
  { id: "star", goal: "Finish a build", opens: "star-power promotions",
    when: (s) => built(s) || games(s) >= 30, go: ["spend", "buy"], to: ["spend", "buy"],
    news: "The front office hires a publicist. Star-power promotions are open.",
    sheet: { title: "Star power", body: "A player at 70 overall or better can be promoted: fame sells more merchandise and raises his trade value. Promotions appear in the Buy list when someone qualifies." } },
  { id: "assistants", goal: "Bank $20,000", opens: "assistant coaches", progress: (s) => [Math.max(0, Math.min(20000, Math.round(s.money))), 20000], money: true,
    when: (s) => s.money >= 20000 || s.year >= 2, to: ["spend", "coach"],
    news: "Assistant coaches are asking about openings on your staff.",
    sheet: { title: "Assistant coaches", body: "An assistant opens another training lane for a signing fee and a wage every game. More lanes mean more players improving at once." } },
  { id: "trades", goal: "Play 30 games", opens: "trades with rival clubs", progress: (s) => [games(s), 30],
    when: (s) => games(s) >= 30 || s.year >= 2, to: ["roster"],
    news: "Rival general managers start taking your calls. Trades are open.",
    sheet: { title: "Trades", body: "Open any of your players to swap him for the rival at the same position; cash settles the difference in value." } },
  // stat pages open as their data arrives
  { id: "records", when: (s) => games(s) >= 5, news: "The club starts keeping a record book." },
  { id: "stats-money", when: (s) => games(s) >= 10, news: "The accountant hands over the first money charts." },
  { id: "stats-players", when: (s) => games(s) >= 10, news: "Scouts start tracking every player's development." },
  { id: "stats-roi", when: (s) => (s.hist?.spend.length ?? 0) > 0, news: null },
  { id: "projections", when: (s) => games(s) >= 20, news: "The analytics department opens: playoff odds and season projections." },
];
const byId = (id) => UNLOCKS.find((u) => u.id === id);

export const isOpen = (s, id) => s.unlocked == null || s.unlocked.includes(id);

// Open anything newly reached; returns the unlocks that just opened
export function checkUnlocks(s) {
  if (s.unlocked == null || !s.city) return [];
  const fresh = UNLOCKS.filter((u) => !s.unlocked.includes(u.id) && u.when(s));
  if (fresh.length) s.unlocked = [...s.unlocked, ...fresh.map((u) => u.id)];
  return fresh;
}

// The one step the player is working toward right now
export function nextObjective(s) {
  if (s.unlocked == null || !s.city) return null;
  const u = UNLOCKS.find((x) => x.goal && !s.unlocked.includes(x.id));
  if (!u) return null;
  const pr = u.progress ? u.progress(s) : null;
  return { id: u.id, goal: u.goal, how: u.how || null, opens: u.opens, progress: pr, money: !!u.money, go: u.go || null };
}
export const objectivesLeft = (s) => (s.unlocked == null ? 0 : UNLOCKS.filter((x) => x.goal && !s.unlocked.includes(x.id)).length);

// The unlock waiting to be shown, and the tabs carrying something new
export const pendingUnlock = (s) => { const u = byId((s.fresh || [])[0]); return u ? { id: u.id, ...u.sheet, to: u.to } : null; };
export function queueUnlock(s, u) {
  if (!u.sheet) return;
  s.fresh = [...(s.fresh || []), u.id];
  if (u.to) s.newTabs = { ...(s.newTabs || {}), [u.to[0]]: true };
}
export function ackUnlock(s) { s.fresh = (s.fresh || []).slice(1); }
export function visitTab(s, tab) { if (s.newTabs?.[tab]) { const { [tab]: _seen, ...rest } = s.newTabs; s.newTabs = rest; } }

// One-line teasers where a locked system would sit
export const nextUnlockNote = {
  gear: "Start a training program to bring in the gear dealer.",
  autodev: "Equip a piece of gear to bring in an equipment manager.",
  ballpark: "Win 5 games to open ballpark construction.",
  star: "Finish a build to open star-power promotions.",
  trades: "Trades open after game 30.",
  projections: "Projections open after game 20.",
};
