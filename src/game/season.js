// ── Season machinery: rivals, schedule, standings, quick-sim, playoffs, offseason ──
// Team index convention everywhere: 0 = the player's club, 1..7 = rivals.

import { LEAGUE, TRAITS, CREEP, ECON, MARKETS } from "./constants.js";
import { genRivalTeam, creepRival, genTeamIdentity, genCallUp, genReplacement } from "./generators.js";
import { ageOneYear, retireChance } from "./talent.js";
import { mapRoster } from "./roster.js";
import { ovr } from "./gear.js";

// Logistic win probability constants (calibrated against the real engine —
// on the 0-100 scale one OVR point is worth K=0.325 of log-odds)
export const QS = { K: 0.09, H: 0.03 }; // matches the engine: +4 team rating ≈ .59, +10 ≈ .70

export const makeRivals = (base = LEAGUE.statBase, playerIdentity = null) => {
  const traitIds = [...TRAITS.map((t) => t.id)];
  // 7 rivals, 6 traits: shuffle and let one trait appear twice
  const pool = [...traitIds].sort(() => Math.random() - 0.5);
  pool.push(traitIds[(Math.random() * traitIds.length) | 0]);
  const usedCities = new Set(playerIdentity ? [playerIdentity.tCity] : []);
  const usedNames = new Set(playerIdentity ? [playerIdentity.name] : []);
  const markets = rollMarkets();
  return Array.from({ length: 7 }, (_, i) => {
    const id = genTeamIdentity(usedCities, usedNames);
    const team = shiftTeam(genRivalTeam(id.name, pool[i], base), MARKETS[markets[i]].offset);
    team.tCity = id.tCity;
    team.market = markets[i];
    return team;
  });
};

// One or two powerhouses, two small markets, the rest in the middle
export const rollMarkets = () => {
  const power = Math.random() < 0.5 ? 1 : 2;
  const list = Array.from({ length: 7 }, (_, i) => (i < power ? "power" : i < power + 2 ? "small" : "mid"));
  return list.sort(() => Math.random() - 0.5);
};
// Move a whole club's ratings (and ceilings) up or down
const SHIFT_KEYS = ["contact", "power", "eye", "speed", "defense", "stuff", "control", "stamina"];
export const shiftPlayer = (p, d) => {
  if (!d) return p;
  const q = { ...p, pot: { ...p.pot } };
  for (const k of SHIFT_KEYS) if (q[k] != null) {
    q[k] = Math.max(30, Math.min(95, Math.round(q[k] + d)));
    if (q.pot[k] != null) q.pot[k] = Math.max(q[k], Math.min(95, Math.round(q.pot[k] + d)));
  }
  return q;
};
export const shiftTeam = (team, d) => {
  if (!d) return team;
  const move = (p) => shiftPlayer(p, d);
  return { ...team, batters: team.batters.map(move), rotation: team.rotation.map(move), pen: team.pen.map(move) };
};
// A market's scouting reach: big clubs land better replacements
export const marketOffset = (team) => MARKETS[team.market || "mid"].offset;
// Old saves: the best club is a powerhouse, the bottom two small markets
export const assignMarkets = (rivals) => {
  if (rivals.every((t) => t.market)) return rivals;
  const order = rivals.map((t, i) => [teamRating(t), i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  return rivals.map((t, i) => ({ ...t, market: t.market || (order.indexOf(i) === 0 ? "power" : order.indexOf(i) >= 5 ? "small" : "mid") }));
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
  // nine bats, the rotation as one, the bullpen as half a player
  const avg = (list) => (list && list.length ? list.reduce((n, p) => n + ovr(p), 0) / list.length : null);
  const rot = avg(team.rotation), pen = avg(team.pen);
  const bats = team.batters.reduce((n, p) => n + ovr(p), 0);
  return (bats + (rot ?? 0) + (pen != null ? 0.5 * pen : 0)) / (team.batters.length + (rot != null ? 1 : 0) + (pen != null ? 0.5 : 0));
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

// Winter: everyone is a year older. Young players grow toward their ceiling,
// players in their prime hold, veterans slide (legs first), and some retire.
// `replace(pos)` supplies whoever takes a retiree's spot.
export function careerWinter(team, replace) {
  const retired = [];
  const step = (p) => {
    const q = ageOneYear(p);
    if (Math.random() < retireChance(q, ovr(q))) {
      const n = { ...replace(p.pos), gear: p.gear };
      retired.push({ old: q, next: n });
      return n;
    }
    return q;
  };
  return { team: mapRoster(team, step), retired };
}
export const ageRoster = (roster) => careerWinter(roster, genCallUp).team;

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

// Standings order: indices 0..7 sorted by wins, then rating, then stable club id.
export const seedOrder = (standings, ratings) =>
  [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) =>
    (standings[b].w - standings[a].w) ||
    (ratings[b] - ratings[a]) ||
    (a - b));

// The whole winter in one pure function.
// Input: current end-of-season state. Output: next-season fields + log lines.
export const runOffseason = ({ year, rivals, standings, ratings, seedOrder: finalizedOrder, championIdx, championName, playerSeed, playerCup, record, fans, history, trophies }) => {
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
  const order = finalizedOrder || seedOrder(standings, ratings);
  // the league anchor: if talent has drifted up, the next wave of replacements is leaner
  const leagueMean = rivals.flatMap((r) => [...r.batters, ...r.rotation, ...r.pen]).reduce((t, p, _, a) => t + ovr(p) / a.length, 0);
  const shift = leagueMean > 68 ? -Math.min(1.5, (leagueMean - 68) / 3) : 0;
  const rivalRetired = [];
  const newRivals = rivals.map((team, i) => {
    const idx = i + 1;
    const rank = order.indexOf(idx);
    const aged = careerWinter(team, (pos) => shiftPlayer(genReplacement(pos, shift), marketOffset(team)));
    aged.retired.forEach((r) => rivalRetired.push({ ...r, club: team.name }));
    // front-office work: worse clubs work harder; only clubs far below the league's middle get a catch-up push
    const mid = [...ratings.slice(1)].sort((a, b) => a - b)[3];
    const catchUp = Math.min(CREEP.rubberCap, Math.max(0, Math.round((mid - CREEP.farBehind - ratings[idx]) * CREEP.rubber)));
    const points = CREEP.base + rank + (rank === 7 ? CREEP.cellarBonus : 0) + catchUp;
    return creepRival(aged.team, points);
  });

  let fansDelta;
  if (playerCup) fansDelta = Math.round(fans * ECON.cupFansPct);
  else if (madePlayoffs) fansDelta = Math.round(fans * ECON.playoffFansPct);
  else fansDelta = -Math.round(fans * 0.05);

  logs.push({ text: `— OFFSEASON, YEAR ${year} — ${championName} ${playerCup ? "— YOUR CLUB —" : ""} take${playerCup ? "" : "s"} the Pennant Cup.`, kind: playerCup ? "win" : "sys" });
  logs.push({ text: `Around the league, every front office reloads. The competition got better.`, kind: "sys" });
  logs.push({ text: `Scouts file their winter reports. Year ${year + 1} is around the corner.`, kind: "sys" });

  const { schedule, rivalDays } = makeSchedule();

  return {
    year: year + 1,
    rivals: newRivals,
    rivalRetired,
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
