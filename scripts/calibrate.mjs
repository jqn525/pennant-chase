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
    const ctx = { batters: roster.batters, sp: roster.sp, rp: roster.rp, opp, fence: FENCE, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: "Test" };
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
const arms = winRate({ ...roster, sp: plus(roster.sp, ["stuff", "control", "stamina"], BOOST), rp: plus(roster.rp, ["stuff", "control", "stamina"], BOOST) }, rivals);

const perBatPoint = (bats - base) / (BOOST * 9 * BAT_STATS.length);
const perArmPoint = (arms - base) / (BOOST * 2 * 3);
console.log(JSON.stringify({ games: GAMES, base: +base.toFixed(4), bats: +bats.toFixed(4), arms: +arms.toFixed(4), perBatPoint: +perBatPoint.toFixed(6), perArmPoint: +perArmPoint.toFixed(6) }, null, 2));
