// Calibrates the advisor's "rating point → wins" constants.
// Plays thousands of instant games for a stock club against the stock league,
// then again with every batter (or the pitchers) a few points better, and
// reports the change in win rate per single rating point.
// Run: node scripts/calibrate.mjs   (results are pasted into advisor.js)

import { LEAGUE, BAT_STATS } from "../src/game/constants.js";
import { genRoster } from "../src/game/generators.js";
import { makeRivals } from "../src/game/season.js";
import { newGame, playGameInstant } from "../src/game/engine.js";
import { FENCE } from "../src/game/franchise.js";

const GAMES = Number(process.argv[2] || 6000);
const BOOST = 5;

function winRate(roster, rivals) {
  let w = 0;
  for (let i = 0; i < GAMES; i++) {
    const opp = rivals[i % rivals.length];
    const g = newGame(opp, i % 2 === 0, 1);
    const ctx = {
      batters: roster.batters, opp, fence: FENCE, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: "Test",
      staff: { sp: roster.rotation[i % 5], setup: roster.pen[0], closer: roster.pen[1] },
      oppStaff: { sp: opp.rotation[i % 5], setup: opp.pen[0], closer: opp.pen[1] },
    };
    playGameInstant(g, ctx);
    if (g.us > g.them) w++;
  }
  return w / GAMES;
}

const roster = genRoster(LEAGUE.statBase);
const rivals = makeRivals(LEAGUE.statBase, { tCity: "Test", name: "Club" });
const plus = (p, keys, n) => { const q = { ...p }; keys.forEach((k) => { q[k] += n; }); return q; };

const base = winRate(roster, rivals);
const bats = winRate({ ...roster, batters: roster.batters.map((p) => plus(p, BAT_STATS, BOOST)) }, rivals);
const ARM = ["stuff", "control", "stamina"];
// one starter's point only matters in his fifth of the games; relievers every game they pitch
const sp1 = winRate({ ...roster, rotation: roster.rotation.map((p, i) => (i === 0 ? plus(p, ARM, BOOST) : p)) }, rivals);
const setupW = winRate({ ...roster, pen: [plus(roster.pen[0], ARM, BOOST), roster.pen[1]] }, rivals);
const closerW = winRate({ ...roster, pen: [roster.pen[0], plus(roster.pen[1], ARM, BOOST)] }, rivals);

const perBatPoint = (bats - base) / (BOOST * 9 * BAT_STATS.length);
const per = (w) => (w - base) / (BOOST * 3);
console.log(JSON.stringify({ games: GAMES, base: +base.toFixed(4), perBatPoint: +perBatPoint.toFixed(6),
  perStarterPoint: +per(sp1).toFixed(6), perSetupPoint: +per(setupW).toFixed(6), perCloserPoint: +per(closerW).toFixed(6) }, null, 2));
