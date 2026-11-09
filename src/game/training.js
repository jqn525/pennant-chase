// ── Coaching staff: training takes games, and only a few players train at once ──
// The club has a handful of training lanes. Each lane belongs to a coach
// (hitting, pitching, or field & baserunning) and works one point at a time:
// the program runs a number of games and is paid game by game, like
// construction. An area with no lane for a while gets rusty.
// Rival clubs run the same lanes, sized by their market.

import { TRAINING, MARKETS } from "./constants.js";
import { credit, pushLog, allPlayers, trainCost, trainCeil, landTraining, nudgeStat, inWinter } from "./franchise.js";
import { everyone, replaceSlot } from "./roster.js";

const fmt = (n) => Math.round(n).toLocaleString("en-US");

export const AREAS = {
  hit: { label: "Hitting", short: "Hitting", coach: "Hitting coach", keys: ["contact", "power", "eye"] },
  pitch: { label: "Pitching", short: "Pitching", coach: "Pitching coach", keys: ["stuff", "control", "stamina"] },
  field: { label: "Field & baserunning", short: "Field", coach: "Field coach", keys: ["speed", "defense"] },
};
export const AREA_IDS = Object.keys(AREAS);

// Which coach owns a player's stat
export function areaOf(p, key) {
  if (key === "defense" || key === "speed") return "field";
  return p.role === "bat" ? "hit" : "pitch";
}
// The stats a coach can work on for this player
export const areaKeys = (p, area) => {
  const own = p.role === "bat" ? ["contact", "power", "eye", "speed", "defense"] : ["stuff", "control", "stamina", "defense"];
  return own.filter((k) => areaOf(p, k) === area);
};

// Games a point takes: longer at higher levels and close to his ceiling
export function gamesFor(s, p, key) {
  const v = p[key];
  let g = TRAINING.games.find(([lim]) => v < lim)[1];
  if (trainCeil(s, p, key) - v <= 5) g += TRAINING.near;
  return g;
}

export const defaultTraining = () => ({
  lanes: [{ area: "hit", prog: null }, { area: "pitch", prog: null }, { area: "field", prog: null }],
  auto: { hit: true, pitch: true, field: true },
  idle: { hit: 0, pitch: 0, field: 0 },
});
export function migrateTraining(t) {
  if (!t || !Array.isArray(t.lanes)) return defaultTraining();
  return { ...defaultTraining(), ...t, auto: { ...defaultTraining().auto, ...t.auto }, idle: { ...defaultTraining().idle, ...t.idle } };
}

export const lanes = (s) => s.training?.lanes || [];
export const hired = (s) => Math.max(0, lanes(s).length - TRAINING.lanes);
export const nextHire = (s) => (lanes(s).length < TRAINING.maxLanes ? TRAINING.hire[hired(s)] : null);
export const wages = (s) => TRAINING.hire.slice(0, hired(s)).reduce((t, h) => t + h.wage, 0);
export const programInstallments = (s) => lanes(s).reduce((t, l) => t + (l.prog ? Math.min(l.prog.perGame, l.prog.cost - l.prog.paid) : 0), 0);
export const freeLane = (s, area) => lanes(s).findIndex((l) => l.area === area && !l.prog);
export const lanesIn = (s, area) => lanes(s).filter((l) => l.area === area);
export const programFor = (s, pid, key) => lanes(s).find((l) => l.prog?.pid === pid && (key == null || l.prog.key === key))?.prog || null;
export const gamesUntilFree = (s, area) => {
  const l = lanesIn(s, area);
  if (!l.length) return null;
  return Math.min(...l.map((x) => (x.prog ? x.prog.left : 0)));
};

// Why this point can't start right now (null when it can)
export function startLock(s, pid, key) {
  if (inWinter(s)) return "Winter: training resumes on opening day";
  const p = allPlayers(s).find((x) => x.id === pid);
  if (!p) return "Not on the club";
  if (p[key] >= trainCeil(s, p, key)) return "At his ceiling";
  if (programFor(s, pid, key)) return "Already training";
  const area = areaOf(p, key);
  if (!lanesIn(s, area).length) return `No ${AREAS[area].label.toLowerCase()} lane`;
  if (freeLane(s, area) < 0) return `${AREAS[area].label} lane${lanesIn(s, area).length > 1 ? "s" : ""} busy (free in ${gamesUntilFree(s, area)} game${gamesUntilFree(s, area) === 1 ? "" : "s"})`;
  return null;
}

export function startProgram(s, pid, key, { auto = false } = {}) {
  if (startLock(s, pid, key)) return false;
  const p = allPlayers(s).find((x) => x.id === pid);
  const area = areaOf(p, key);
  const i = freeLane(s, area);
  const cost = trainCost(s, p, key), games = gamesFor(s, p, key);
  const perGame = Math.ceil(cost / games);
  if (s.money < perGame) return false;
  const prog = { pid, key, name: p.name, from: p[key], cost, games, left: games, perGame, paid: 0, stalled: false, auto: auto || undefined };
  s.training.lanes = s.training.lanes.map((l, j) => (j === i ? { ...l, prog } : l));
  if (!auto) pushLog(s, `${p.name} starts on his ${key} with the ${AREAS[area].coach.toLowerCase()}: ${games} games at $${fmt(perGame)} a game.`, "sys");
  return true;
}

export function cancelProgram(s, i) {
  const l = lanes(s)[i];
  if (!l?.prog) return false;
  s.training.lanes = s.training.lanes.map((x, j) => (j === i ? { ...x, prog: null } : x));
  pushLog(s, `${l.prog.name}'s ${l.prog.key} program is dropped after $${fmt(l.prog.paid)}.`, "out");
  return true;
}

// Point a lane at another coach (only while it's idle)
export function assignLane(s, i, area) {
  const l = lanes(s)[i];
  if (!l || l.prog || !AREAS[area] || l.area === area) return false;
  s.training.lanes = s.training.lanes.map((x, j) => (j === i ? { ...x, area } : x));
  return true;
}

export function hireLane(s, area = "hit") {
  const h = nextHire(s);
  if (!h || inWinter(s) || s.money < h.fee) return false;
  credit(s, "coaching", -h.fee);
  s.training.lanes = [...s.training.lanes, { area, prog: null }];
  pushLog(s, `An assistant ${AREAS[area].label.toLowerCase()} coach signs on for $${fmt(h.fee)} and $${fmt(h.wage)} a game: lane ${s.training.lanes.length} opens.`, "win");
  return true;
}

export function setCoachAuto(s, area, on) {
  s.training = { ...s.training, auto: { ...s.training.auto, [area]: on } };
}

// After each game: pay and advance programs, land finished points, pay assistants, rust idle areas
export function progressTraining(s) {
  if (!s.training) return;
  const out = [];
  s.training.lanes = s.training.lanes.map((l) => {
    const pr = l.prog;
    if (!pr) return l;
    const p = allPlayers(s).find((x) => x.id === pr.pid);
    if (!p) { pushLog(s, `${pr.name} has left the club; his ${pr.key} program ends.`, "out"); return { ...l, prog: null }; }
    const pay = Math.min(pr.perGame, pr.cost - pr.paid);
    if (s.money < pay) {
      if (!pr.stalled) pushLog(s, `${pr.name}'s ${pr.key} program has stalled: not enough cash for this game's $${fmt(pay)}.`, "out");
      return { ...l, prog: { ...pr, stalled: true } };
    }
    credit(s, "training", -pay);
    const next = { ...pr, paid: pr.paid + pay, left: pr.left - 1, stalled: false };
    if (next.left > 0) return { ...l, prog: next };
    out.push(next);
    return { ...l, prog: null };
  });
  for (const pr of out) landTraining(s, pr.pid, pr.key, pr.paid, pr.auto);
  const w = wages(s);
  if (w) credit(s, "coaching", -Math.min(w, Math.max(0, s.money)));
  rustTick(s);
}

// Areas with no lane fall behind: every rustAfter games one player loses a point
export function rustTick(s) {
  const t = s.training;
  for (const area of AREA_IDS) {
    if (lanesIn(s, area).length) { t.idle[area] = 0; continue; }
    t.idle[area] = (t.idle[area] || 0) + 1;
    if (t.idle[area] < TRAINING.rustAfter) continue;
    t.idle[area] = 0;
    const pool = allPlayers(s).flatMap((p) => (p.rust?.y === s.year && p.rust.n >= TRAINING.rustMax ? [] : areaKeys(p, area).filter((k) => p[k] > 35).map((k) => [p, k])));
    if (!pool.length) continue;
    const [p, k] = pool[(Math.random() * pool.length) | 0];
    nudgeStat(s, p.id, k, -1, (q) => ({ ...q, rust: { y: s.year, n: (q.rust?.y === s.year ? q.rust.n : 0) + 1 } }));
    pushLog(s, `Rust: ${p.name}'s ${k} slips to ${p[k] - 1} (${AREAS[area].label.toLowerCase()} has no coach lane).`, "out");
  }
}

// ── Rivals: the same lanes, run in the background ──
// Lanes lean toward the club's identity; each lane finishes points at the same
// games-per-point the player's club gets. `games` = games played since last call.
const LEAN = { aces: ["pitch", "pitch", "hit", "field", "hit"], gloves: ["field", "hit", "pitch", "field", "pitch"], smallball: ["field", "hit", "pitch", "hit", "pitch"] };
export function rivalLaneAreas(team) {
  const order = LEAN[team.traitId] || ["hit", "pitch", "field", "hit", "pitch"];
  const n = MARKETS[team.market || "mid"].lanes;
  return Array.from({ length: n }, (_, i) => order[i % order.length]);
}
const rivalCeil = (p, k) => Math.min(TRAINING.rivalCap ?? 95, p.pot?.[k] ?? p[k]);
function rivalTarget(team, area) {
  const pool = everyone(team).flatMap((p) => areaKeys(p, area).filter((k) => p[k] < rivalCeil(p, k)).map((k) => [p, k]));
  if (!pool.length) return null;
  // a coach works where the gain is cheapest: lower ratings first, with some noise
  pool.sort((a, b) => a[0][a[1]] - b[0][b[1]] + (Math.random() - 0.5) * 12);
  const [p, k] = pool[0];
  return { pid: p.id, key: k, left: gamesFor({}, { ...p, pot: p.pot }, k) };
}
export function rivalTraining(team, games) {
  const areas = rivalLaneAreas(team);
  let t = team;
  const prev = team.lanes || [];
  const next = [];
  for (let i = 0; i < areas.length; i++) {
    let lane = prev[i] && prev[i].area === areas[i] ? { ...prev[i] } : { area: areas[i], prog: null };
    let g = games;
    while (g > 0) {
      if (!lane.prog || !everyone(t).some((p) => p.id === lane.prog.pid)) lane.prog = rivalTarget(t, lane.area);
      if (!lane.prog) break;
      const step = Math.min(g, lane.prog.left);
      lane.prog = { ...lane.prog, left: lane.prog.left - step };
      g -= step;
      if (lane.prog.left <= 0) {
        const p = everyone(t).find((x) => x.id === lane.prog.pid);
        if (p && p[lane.prog.key] < rivalCeil(p, lane.prog.key)) t = replaceSlot(t, p.id, { ...p, [lane.prog.key]: p[lane.prog.key] + 1 });
        lane.prog = null;
      }
    }
    next.push(lane);
  }
  return { ...t, lanes: next };
}
