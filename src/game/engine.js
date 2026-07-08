// ── Pure game engine: runs one game of baseball with no React in sight ──
// Used by BOTH the live at-bat ticker and MAX-speed instant simulation, so the
// two modes can never drift apart. All mutations happen on the game object `g`;
// log lines are pushed into `events`; season-stat deltas accumulate in g.statAcc
// (the caller flushes them into React state).

import { resolveAtBat } from "./atBat.js";
import { eff } from "./gear.js";
import { LEAGUE, ECON, gateMult } from "./constants.js";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A fresh live-game object. `home` = whether OUR club is the home team.
export const newGame = (opp, home, oppIdx) => ({
  opp, oppIdx, home,
  inning: 1, half: "top", outs: 0, bases: [null, null, null],
  us: 0, them: 0, usIdx: 0, themIdx: 0, spFaced: 0, usingRP: false,
  over: false, hrUs: 0, result: null,
  box: { us: {}, them: {}, lobUs: 0, lobThem: 0, errUs: 0, errThem: 0 },
  balls: [], // every ball in play this game: {spray, dist, t} for the field view
  statAcc: {}, // player id -> {statKey: delta}, flushed by the caller
});

// ctx is built once per game: { batters, sp, rp, opp, fence, statBase, innings, cityName }
export function stepAtBat(g, ctx, events) {
  if (g.over) return;
  const emit = (text, kind = "play", side = null, team = null) => events.push({ text, kind, side, team });

  // Visitors bat the top. We bat bottom when we're home.
  const weBat = g.half === (g.home ? "bottom" : "top");
  const batters = weBat ? ctx.batters : g.opp.batters;
  const idx = weBat ? g.usIdx : g.themIdx;
  const batter = eff(batters[idx % 9]);

  let pitcher;
  if (weBat) pitcher = eff(g.opp.sp);
  else {
    const limit = 8 + ctx.sp.stamina * 2; // stamina has no gear item
    if (!g.usingRP && g.spFaced >= limit) {
      g.usingRP = true;
      emit(`${ctx.sp.name} is gassed after ${g.spFaced} batters. ${ctx.rp.name} jogs in from the pen.`, "sys");
    }
    pitcher = eff(g.usingRP ? ctx.rp : ctx.sp);
    g.spFaced++;
  }
  const side = weBat ? "us" : "them";
  const teamName = weBat ? ctx.cityName : g.opp.name;

  // Live box score for THIS game — both teams
  const gb = (pid, key, n = 1) => {
    const line = g.box[side][pid] || (g.box[side][pid] = { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0 });
    line[key] += n;
  };
  // Season stats for OUR players only: batters in our half, our pitcher in theirs
  const track = weBat;
  const trackP = !weBat;
  const acc = (pid, key, n = 1) => {
    const a = g.statAcc[pid] || (g.statAcc[pid] = {});
    a[key] = (a[key] || 0) + n;
  };

  // Wild pitch: with runners aboard, a low-Control arm sometimes lets one go.
  // Consumes the moment — the at-bat continues next tick.
  if (g.bases.some(Boolean) && Math.random() < clamp(0.018 - (pitcher.control - ctx.statBase) * 0.004, 0.004, 0.05)) {
    const third = g.bases[2];
    if (third) {
      weBat ? g.us++ : g.them++;
      if (track) acc(third.id, "r");
      if (trackP) acc(pitcher.id, "raP");
      gb(third.id, "r");
    }
    g.bases = [null, g.bases[0], g.bases[1]];
    emit(`Wild pitch! It skips to the backstop and the runners move up${third ? " — a run scores!" : "."}`, third ? "hr" : "play", side, teamName);
    // a wild pitch can end the game on a walk-off
    if (g.half === "bottom" && g.inning >= ctx.innings && (g.home ? g.us : g.them) > (g.home ? g.them : g.us)) finish(g);
    return;
  }

  const fielders = (weBat
    ? [...g.opp.batters, { ...g.opp.sp }]
    : [...ctx.batters, { ...(g.usingRP ? ctx.rp : ctx.sp) }]).map(eff);

  const out = resolveAtBat(batter, pitcher, fielders, ctx.fence, ctx.statBase, { forceOn1: !!g.bases[0], outs: g.outs });
  const who = `${batter.name} (${batter.pos})`;

  // Field view: record where the ball landed
  if (out.dist != null && g.balls.length < 100) {
    const t = out.type === "HR" ? "hr" : out.type === "HIT" ? "hit" : out.type === "E" ? "err" : "out";
    g.balls.push({ spray: out.spray, dist: Math.round(out.dist), t });
  }

  if (out.type === "K") {
    if (track) { acc(batter.id, "ab"); acc(batter.id, "k"); }
    if (trackP) { acc(pitcher.id, "kP"); acc(pitcher.id, "outsP"); }
    gb(batter.id, "ab"); gb(batter.id, "k");
    g.outs++;
    emit(`${who} ${out.text}`, weBat ? "out" : "play", side, teamName);
  } else if (out.type === "BB") {
    if (track) acc(batter.id, "bb");
    if (trackP) acc(pitcher.id, "bbP");
    gb(batter.id, "bb");
    // force runners; bases loaded walks in the runner from third
    if (g.bases[0] && g.bases[1] && g.bases[2]) {
      weBat ? g.us++ : g.them++;
      if (track) { acc(g.bases[2].id, "r"); acc(batter.id, "rbi"); }
      if (trackP) acc(pitcher.id, "raP");
      gb(g.bases[2].id, "r"); gb(batter.id, "rbi");
      g.bases[2] = null;
    }
    if (g.bases[0] && g.bases[1]) g.bases[2] = g.bases[2] || g.bases[1];
    if (g.bases[0]) g.bases[1] = g.bases[1] || g.bases[0];
    g.bases[0] = batter;
    emit(`${who} ${out.text}`, "play", side, teamName);
  } else if (out.type === "OUT") {
    if (track) acc(batter.id, "ab");
    if (trackP) acc(pitcher.id, "outsP");
    gb(batter.id, "ab");
    g.outs++;
    emit(`${who} ${out.text}`, weBat ? "out" : "play", side, teamName);
  } else if (out.type === "DP") {
    // ground ball double play: batter and the runner on first are both out
    if (track) acc(batter.id, "ab");
    if (trackP) acc(pitcher.id, "outsP", 2);
    gb(batter.id, "ab");
    g.outs += 2;
    g.bases[0] = null;
    emit(`${who} ${out.text}`, weBat ? "out" : "play", side, teamName);
  } else if (out.type === "E") {
    // booted ball: batter safe, everyone moves up a base, no hit awarded
    if (track) acc(batter.id, "ab");
    gb(batter.id, "ab");
    if (weBat) g.box.errThem++; else g.box.errUs++;
    const third = g.bases[2];
    if (third) {
      weBat ? g.us++ : g.them++;
      if (track) acc(third.id, "r");
      if (trackP) acc(pitcher.id, "raP");
      gb(third.id, "r");
    }
    g.bases = [batter, g.bases[0], g.bases[1]];
    emit(`${who} ${out.text}${third ? " A run scores!" : ""}`, "play", side, teamName);
  } else {
    // HR or HIT
    if (track) { acc(batter.id, "ab"); acc(batter.id, "h"); }
    if (trackP) acc(pitcher.id, "hP");
    gb(batter.id, "ab"); gb(batter.id, "h");
    let runs = 0;
    if (out.type === "HR") {
      const runners = g.bases.filter(Boolean);
      runs = 1 + runners.length;
      if (track) {
        acc(batter.id, "hr"); acc(batter.id, "r"); acc(batter.id, "rbi", runs);
        runners.forEach((p) => acc(p.id, "r"));
      }
      gb(batter.id, "hr"); gb(batter.id, "r"); gb(batter.id, "rbi", runs);
      runners.forEach((p) => gb(p.id, "r"));
      g.bases = [null, null, null];
      if (weBat) g.hrUs++;
    } else {
      const b = out.bases;
      if (track && b === 2) acc(batter.id, "d");
      if (track && b === 3) acc(batter.id, "t");
      if (b === 2) gb(batter.id, "d");
      if (b === 3) gb(batter.id, "t");
      const scored = [];
      for (let i = 2; i >= 0; i--) {
        if (!g.bases[i]) continue;
        if (i + b >= 3) { scored.push(g.bases[i]); g.bases[i] = null; }
        else { g.bases[i + b] = g.bases[i]; g.bases[i] = null; }
      }
      runs = scored.length;
      if (track && runs) {
        scored.forEach((p) => acc(p.id, "r"));
        acc(batter.id, "rbi", runs);
      }
      if (runs) {
        scored.forEach((p) => gb(p.id, "r"));
        gb(batter.id, "rbi", runs);
      }
      g.bases[b - 1] = batter;
    }
    if (runs) {
      weBat ? (g.us += runs) : (g.them += runs);
      if (trackP) acc(pitcher.id, "raP", runs);
    }
    emit(`${who} ${out.text}${runs ? ` ${runs} run${runs > 1 ? "s" : ""} score${runs > 1 ? "" : "s"}!` : ""}`, out.type === "HR" ? "hr" : "play", side, teamName);
  }

  if (weBat) g.usIdx = (idx + 1) % 9; else g.themIdx = (idx + 1) % 9;

  const homeScore = g.home ? g.us : g.them;
  const awayScore = g.home ? g.them : g.us;
  const homeName = g.home ? ctx.cityName : g.opp.name;
  const awayName = g.home ? g.opp.name : ctx.cityName;

  // Walk-off: home team takes the lead batting in (or after) the final inning
  if (g.half === "bottom" && g.inning >= ctx.innings && homeScore > awayScore) {
    finish(g);
    return;
  }

  if (g.outs >= 3) {
    const stranded = g.bases.filter(Boolean).length;
    if (weBat) g.box.lobUs += stranded; else g.box.lobThem += stranded;
    g.outs = 0; g.bases = [null, null, null];
    if (g.half === "top") {
      // Home team skips the bottom of the final inning if already ahead
      if (g.inning >= ctx.innings && homeScore > awayScore) { finish(g); return; }
      g.half = "bottom";
      emit(`Middle ${g.inning}. ${awayName} ${awayScore}, ${homeName} ${homeScore}.`, "sys");
    } else {
      if (g.inning >= ctx.innings && g.us !== g.them) { finish(g); return; }
      g.inning++;
      g.half = "top";
      emit(g.inning > ctx.innings ? `Tied after regulation — extra innings!` : `End ${g.inning - 1}. Heading to the ${g.inning}${["st", "nd", "rd"][g.inning - 1] || "th"}.`, "sys");
    }
  }
}

function finish(g) {
  g.over = true;
  g.result = { won: g.us > g.them, us: g.us, them: g.them, hrUs: g.hrUs };
}

// Simulate the rest of a game instantly (MAX speed). Discards play-by-play,
// keeps box score and stat deltas identical to live play by construction.
export function playGameInstant(g, ctx) {
  const scratch = [];
  let guard = 0;
  while (!g.over && guard++ < 600) {
    stepAtBat(g, ctx, scratch);
    scratch.length = 0;
  }
  if (!g.over) finish(g); // pathological marathon: call it where it stands
}

// Money and fans for a finished game. Pure — caller applies the deltas.
export function settleGame(g, { fans, gateBonus, floorBonus, fansBonus, cityName, playoff }) {
  const won = g.us > g.them;
  let moneyDelta, fansDelta = 0, text, kind;
  const score = won ? `${cityName} ${g.us}, ${g.opp.name} ${g.them}` : `${g.opp.name} ${g.them}, ${cityName} ${g.us}`;
  if (playoff) {
    moneyDelta = won ? ECON.playoffWinPay : LEAGUE.payFloor;
    text = `FINAL (${playoff}): ${score}.${won ? ` Playoff gate: $${ECON.playoffWinPay}.` : ""}`;
    kind = won ? "win" : "out";
  } else if (won) {
    moneyDelta = LEAGUE.payWin * gateMult(fans) * (gateBonus ? 1.25 : 1);
    fansDelta = LEAGUE.fansPerWin + g.hrUs * 2;
    if (fansBonus) fansDelta = Math.round(fansDelta * 1.25);
    text = `FINAL: ${score}. Gate receipts $${Math.round(moneyDelta)}, +${fansDelta} fans.`;
    kind = "win";
  } else {
    moneyDelta = LEAGUE.payFloor * (floorBonus ? 2 : 1) + fans * 0.02;
    text = `FINAL: ${score}. The faithful still show up — $${Math.round(moneyDelta)} at the gate.`;
    kind = "out";
  }
  return { won, moneyDelta, fansDelta, text, kind };
}
