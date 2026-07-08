// ── Season machinery: rivals, schedule, standings, quick-sim, playoffs, offseason ──
// Team index convention everywhere: 0 = the player's club, 1..7 = rivals.

import { LEAGUE, RIVAL_NAMES, TRAITS, CREEP, ECON } from "./constants.js";
import { genRivalTeam, creepRival } from "./generators.js";
import { ovr } from "./gear.js";

// Logistic win probability constants (calibrated against the real engine —
// see v3-balance sim: engine win% vs mean-OVR gap fits K≈1.3)
export const QS = { K: 1.3, H: 0.03 };

export const makeRivals = (base = LEAGUE.statBase) => {
  const traitIds = [...TRAITS.map((t) => t.id)];
  // 7 rivals, 6 traits: shuffle and let one trait appear twice
  const pool = [...traitIds].sort(() => Math.random() - 0.5);
  pool.push(traitIds[(Math.random() * traitIds.length) | 0]);
  return RIVAL_NAMES.map((name, i) => genRivalTeam(name, pool[i], base));
};

// Per rival: 6 series, 22 games, 11 home / 11 away
const SERIES_PATTERN = [
  { home: true, games: 4 }, { home: false, games: 3 }, { home: true, games: 3 },
  { home: false, games: 4 }, { home: true, games: 4 }, { home: false, games: 4 },
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Returns { schedule: [{opp, home}] x 154, rivalDays: [[ [a,b]x3 ]] x 154 }
export const makeSchedule = () => {
  // 6 rounds; round r holds each rival's r-th series, shuffled within the round
  const schedule = [];
  for (let r = 0; r < SERIES_PATTERN.length; r++) {
    const seriesList = shuffle([1, 2, 3, 4, 5, 6, 7].map((opp) => ({ opp, ...SERIES_PATTERN[r] })));
    for (const s of seriesList) {
      for (let gm = 0; gm < s.games; gm++) schedule.push({ opp: s.opp, home: s.home });
    }
  }

  // Pair the 6 idle rivals each day, balancing head-to-head meeting counts
  const meetings = {}; // "a-b" -> count
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const rivalDays = schedule.map((day) => {
    const idle = [1, 2, 3, 4, 5, 6, 7].filter((t) => t !== day.opp);
    const games = [];
    while (idle.length) {
      const a = idle.shift();
      let best = 0, bestCount = Infinity;
      for (let j = 0; j < idle.length; j++) {
        const c = meetings[key(a, idle[j])] || 0;
        if (c < bestCount) { bestCount = c; best = j; }
      }
      const b = idle.splice(best, 1)[0];
      const k = key(a, b);
      meetings[k] = (meetings[k] || 0) + 1;
      // alternate home team by meeting parity
      games.push(meetings[k] % 2 ? [a, b] : [b, a]);
    }
    return games;
  });

  return { schedule, rivalDays };
};

// Mean overall of the nine bats plus the starter
export const teamRating = (team) => {
  const players = [...team.batters, team.sp];
  return players.reduce((n, p) => n + ovr(p), 0) / players.length;
};

// One quick game between two rated teams; returns true if A (home if homeA) wins
export const quickSim = (rA, rB, homeA = true) => {
  let p = 1 / (1 + Math.exp(-(rA - rB) * QS.K)) + (homeA ? QS.H : -QS.H);
  p = Math.min(0.95, Math.max(0.05, p));
  return Math.random() < p;
};

// Quick-sim a whole playoff series; returns true if team A wins it.
// Home patterns: best-of-5 → 2-2-1, best-of-7 → 2-3-2 (A = higher seed).
export const simSeries = (rA, rB, bestOf) => {
  const homeA = bestOf === 5 ? [1, 1, 0, 0, 1] : [1, 1, 0, 0, 0, 1, 1];
  const need = Math.ceil(bestOf / 2);
  let a = 0, b = 0, gm = 0;
  while (a < need && b < need) {
    quickSim(rA, rB, !!homeA[gm]) ? a++ : b++;
    gm++;
  }
  return a > b;
};

// Winter takes its toll: every player loses one point from a random stat that
// sits above the league base. Gear is unaffected. Keeps an infinite game honest —
// you spend to climb AND to hold your ground.
export const ageRoster = (roster) => {
  const age = (p, keys) => {
    const q = { ...p };
    const above = keys.filter((k) => q[k] > LEAGUE.statBase);
    if (above.length) q[above[(Math.random() * above.length) | 0]] -= 1;
    return q;
  };
  const BAT = ["contact", "power", "eye", "speed", "defense"];
  const PIT = ["stuff", "control", "stamina", "defense"];
  return {
    batters: roster.batters.map((b) => age(b, BAT)),
    sp: age(roster.sp, PIT),
    rp: age(roster.rp, PIT),
  };
};

// Where are we in the current series? Uses the schedule (series = consecutive
// games vs the same club at the same park) and recent form for the series score.
export const seriesInfo = (schedule, gameIndex, form) => {
  if (!schedule || gameIndex >= schedule.length) return null;
  const cur = schedule[gameIndex];
  let start = gameIndex;
  while (start > 0 && schedule[start - 1].opp === cur.opp && schedule[start - 1].home === cur.home) start--;
  let end = gameIndex;
  while (end + 1 < schedule.length && schedule[end + 1].opp === cur.opp && schedule[end + 1].home === cur.home) end++;
  const len = end - start + 1;
  const played = gameIndex - start; // completed games this series
  const results = form.slice(Math.max(0, form.length - played));
  const w = results.filter((r) => r === "W").length;
  return { gameInSeries: played + 1, len, w, l: played - w, gamesLeft: len - played };
};

export const pct = (t) => (t.w + t.l ? t.w / (t.w + t.l) : 0);
export const gamesBehind = (leader, t) => ((leader.w - t.w) + (t.l - leader.l)) / 2;

// Standings order: indices 0..7 sorted by wins, then rating, then coin flip
export const seedOrder = (standings, ratings) =>
  [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) =>
    (standings[b].w - standings[a].w) ||
    (ratings[b] - ratings[a]) ||
    (Math.random() - 0.5));

// The whole winter in one pure function.
// Input: current end-of-season state. Output: next-season fields + log lines.
export const runOffseason = ({ year, rivals, standings, ratings, championIdx, championName, playerSeed, playerCup, record, fans, history, trophies }) => {
  const logs = [];
  const madePlayoffs = playerSeed < LEAGUE.playoffTeams;

  const entry = {
    year,
    champion: championName,
    playerRecord: `${record.w}-${record.l}`,
    finish: playerSeed + 1,
    cup: playerCup,
  };

  // Rival development: worse finish = bigger winter, and anyone trailing the
  // player's rating gets a rubber-band boost so dynasties stay hunted
  const order = seedOrder(standings, ratings);
  const newRivals = rivals.map((team, i) => {
    const idx = i + 1;
    const rank = order.indexOf(idx);
    const catchUp = Math.min(CREEP.rubberCap, Math.max(0, Math.round((ratings[0] - ratings[idx]) * CREEP.rubber)));
    const points = CREEP.base + rank + (rank === 7 ? CREEP.cellarBonus : 0) + catchUp;
    return creepRival(team, points);
  });

  let fansDelta;
  if (playerCup) fansDelta = ECON.cupFans;
  else if (madePlayoffs) fansDelta = ECON.playoffFans;
  else fansDelta = -Math.round(fans * 0.05);

  logs.push({ text: `— OFFSEASON, YEAR ${year} — ${championName} ${playerCup ? "— YOUR CLUB —" : ""} take${playerCup ? "" : "s"} the Pennant Cup.`, kind: playerCup ? "win" : "sys" });
  logs.push({ text: `Around the league, every front office reloads. The competition got better.`, kind: "sys" });
  logs.push({ text: `Scouts file their winter reports. Year ${year + 1} is around the corner.`, kind: "sys" });

  const { schedule, rivalDays } = makeSchedule();

  return {
    year: year + 1,
    rivals: newRivals,
    schedule,
    rivalDays,
    gameIndex: 0,
    standings: Array.from({ length: 8 }, () => ({ w: 0, l: 0 })),
    playoffs: null,
    phase: "regular",
    history: [...history, entry],
    trophies: trophies + (playerCup ? 1 : 0),
    fansDelta,
    seasonStats: {},
    form: [],
    logs,
  };
};
