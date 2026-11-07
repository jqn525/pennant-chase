// ── The advisor: every way to spend money, valued in dollars per game ──
// Pure. options(s) lists each available spend with its cost, its estimated
// gain per game and its payback (games until it earns its cost back), sorted
// best first. apply(s, option) carries one out through franchise.js.
//
// How gains are estimated:
// - Builds pay directly: the per-game income difference with and without the
//   next tier, using the game's own gate / merch formulas.
// - Ratings pay through wins. Calibrated by scripts/calibrate.mjs (6,000
//   instant games per arm): +1 point on one batter stat ≈ +0.10% win chance,
//   +1 on a pitcher stat ≈ +0.09%. A win is worth its gate bonus plus the
//   fans it brings, each fan worth what it pays over a planning horizon.
// - Attendance counts fans only up to the seat cap, so past it more fans
//   pay nothing at the gate until you build seats.
// - Merch pays per real second, so its per-game value depends on the pace.

import { ECON, LEAGUE, BAT_STATS, PIT_STATS, stadiumFx, revenueFx } from "./constants.js";
import { eff } from "./gear.js";
import { CARD_TIERS, nextPrint, cardDraw } from "./cards.js";
import { ticketGate } from "./engine.js";
import {
  allPlayers, merchRate, trainCost, trainCeil, buildLock, build, BALLPARK, trackLevel,
  train, buyGear, printCard,
} from "./franchise.js";

export const WIN_PER_BAT_POINT = 0.001;
export const WIN_PER_ARM_POINT = 0.0009;
export const HORIZON = 100; // games a new fan keeps paying, for valuing growth
// A win also moves you up the table. The playoff purse (a likely semifinal
// run's share of series pay, game pay and Cup money) times the share of a
// playoff spot one regular-season win is worth in a typical race.
export const PLAYOFF_PURSE = 0.5 * ECON.semisSeriesPay + 3 * ECON.playoffWinPay + 0.25 * ECON.cupPay;
export const RACE_SHARE = 0.03;
export const SECONDS_PER_GAME = { 1: 66, 4: 17, max: 1 };

const statsOf = (p) => (p.role === "bat" ? BAT_STATS : PIT_STATS);
const winPerPoint = (p) => (p.role === "bat" ? WIN_PER_BAT_POINT : WIN_PER_ARM_POINT);

// Season win rate so far (a fair 50% before any games)
export function winRate(s) {
  const { w, l } = s.standings[0];
  return w + l >= 10 ? w / (w + l) : 0.5;
}

// Expected income from one game's tickets and bonus, for a stadium layout
function gameIncome(s, stadium, fans = s.fans) {
  const fx = stadiumFx(stadium);
  const { gate } = ticketGate({
    fans, playoff: false, formWins: s.form.filter((f) => f === "W").length,
    attCap: fx.attCap, rateBonus: fx.rateBonus, gateBonus: s.city?.bonus === "gate", gateMult: fx.gateMult,
  });
  const wr = winRate(s);
  const bonus = (wr * ECON.gateWinBase + (1 - wr) * ECON.gateLossBase * (s.city?.bonus === "floor" ? 2 : 1)) * fx.gateMult;
  return gate + bonus;
}

// What one extra fan is worth per game: their ticket share plus merch
function perFan(s) {
  const now = gameIncome(s, s.stadium) - gameIncome(s, s.stadium, s.fans - 100);
  const merch = merchGap(s, s.merch, s.tv, s.fans + 100) / 100;
  return Math.max(0, now / 100 + merch);
}

// Fans one win brings (flat + compounding share, before streaks)
export function fansPerWin(s, fansMult = stadiumFx(s.stadium).fansMult) {
  const flat = LEAGUE.fansPerWin * fansMult * (s.city?.bonus === "fans" ? 1.25 : 1);
  return flat + s.fans * ECON.fanWinPct * fansMult;
}

// Dollars one extra win is worth
export function valueOfWin(s) {
  const fx = stadiumFx(s.stadium);
  const bonus = (ECON.gateWinBase - ECON.gateLossBase) * fx.gateMult;
  return bonus + fansPerWin(s) * perFan(s) * HORIZON + PLAYOFF_PURSE * RACE_SHARE;
}

function merchPerGame(s, merch, tv, fans = s.fans, draw = cardDraw(allPlayers(s))) {
  if (!merch) return 0;
  const fx = revenueFx(merch, tv);
  return merchRate(fans, draw, fx.merchMult, fx.tvMult, s.city?.bonus === "merch") * (SECONDS_PER_GAME[s.speed] ?? 66);
}
const merchGap = (s, merch, tv, fans) => merchPerGame(s, merch, tv, fans) - merchPerGame(s, merch, tv);

const payback = (cost, gain) => (gain > 0.005 ? cost / gain : Infinity);

// ── Option builders ──
function trainOptions(s, vWin) {
  return allPlayers(s).flatMap((p) => {
    // the cheapest next point on this player
    let best = null;
    for (const k of statsOf(p)) {
      if (p[k] >= trainCeil(s, p, k)) continue;
      const c = trainCost(s, p, k);
      if (!best || c < best.cost) best = { k, cost: c };
    }
    if (!best) return [];
    const gain = winPerPoint(p) * vWin;
    return [{
      id: `train-${p.id}`, kind: "Train", cost: best.cost, gainPerGame: gain,
      title: `${p.name} · ${best.k} ${p[best.k]} → ${p[best.k] + 1}`,
      detail: `$${best.cost} per point · ${p.pos}`,
      action: { type: "train", pid: p.id, key: best.k },
    }];
  });
}

// Effective rating points an item adds for a player (replacing his current one)
export function gearGain(p, item) {
  const before = eff(p);
  const after = eff({ ...p, gear: { ...(p.gear || {}), [item.slot]: item } });
  return statsOf(p).reduce((n, k) => n + (after[k] - before[k]), 0);
}

function gearOptions(s, vWin) {
  return (s.shopItems || []).flatMap((item) => {
    let best = null;
    for (const p of allPlayers(s)) {
      const isBat = p.role === "bat";
      const forBat = ["bat", "batGloves", "cleats", "glove", "shades"].includes(item.slot);
      if (isBat !== forBat) continue;
      const pts = gearGain(p, item);
      if (!best || pts > best.pts) best = { p, pts };
    }
    if (!best || best.pts <= 0) return [];
    const gain = best.pts * winPerPoint(best.p) * vWin;
    return [{
      id: `gear-${item.id}`, kind: "Gear", cost: item.cost, gainPerGame: gain,
      title: `${item.name} → ${best.p.name}`,
      detail: `+${best.pts} rating points · $${Math.round(item.cost / best.pts)} per point`,
      action: { type: "gear", pid: best.p.id, itemId: item.id },
    }];
  });
}

function buildOptions(s, vWin) {
  return BALLPARK.flatMap((track) => {
    const lvl = trackLevel(s, track.id);
    const next = track.tiers[lvl];
    if (!next) return [];
    let gain = 0, why = next.label;
    if (["parking", "seats", "conc"].includes(track.id)) {
      gain = gameIncome(s, { ...s.stadium, [track.id]: lvl + 1 }) - gameIncome(s, s.stadium);
      if (track.id === "seats" && gain < 1) why = `${next.label} · pays once fans outgrow ${stadiumFx(s.stadium).attCap.toLocaleString("en-US")} seats`;
    } else if (track.id === "lights") {
      const extraFans = fansPerWin(s, stadiumFx({ ...s.stadium, lights: lvl + 1 }).fansMult) - fansPerWin(s);
      gain = winRate(s) * extraFans * perFan(s) * HORIZON;
    } else if (track.id === "merch") {
      gain = merchPerGame(s, lvl + 1, s.tv) - merchPerGame(s, s.merch, s.tv);
    } else if (track.id === "tv") {
      gain = merchPerGame(s, s.merch, lvl + 1) - merchPerGame(s, s.merch, s.tv);
    }
    return [{
      id: `build-${track.id}`, kind: "Build", cost: next.cost, gainPerGame: gain,
      title: `${next.name}`, detail: `${track.title.charAt(0) + track.title.slice(1).toLowerCase()} ${lvl + 1} · ${why}`,
      lock: buildLock(s, track.id), action: { type: "build", id: track.id },
    }];
  });
}

function printOptions(s) {
  return allPlayers(s).flatMap((p) => {
    const up = nextPrint(p);
    if (!up) return [];
    const drawNow = cardDraw(allPlayers(s));
    const drawAfter = drawNow - CARD_TIERS[p.cardTier || 0].draw + up.draw;
    const gain = merchPerGame(s, s.merch, s.tv, s.fans, drawAfter) - merchPerGame(s, s.merch, s.tv);
    return [{
      id: `print-${p.id}`, kind: "Print", cost: up.cost, gainPerGame: gain,
      title: `${p.name} · ${up.name} card`,
      detail: s.merch ? "Sells more jerseys · raises trade value" : "Pays once you own a merch store · raises trade value",
      action: { type: "print", pid: p.id },
    }];
  });
}

// Every option, best first: buyable by payback, then locked ones
export function options(s) {
  if (!s.roster) return [];
  const vWin = valueOfWin(s);
  const all = [...trainOptions(s, vWin), ...gearOptions(s, vWin), ...buildOptions(s, vWin), ...printOptions(s)]
    .map((o) => {
      const pb = payback(o.cost, o.gainPerGame);
      const lock = o.lock || (s.money < o.cost ? `Needs $${Math.ceil(o.cost - s.money).toLocaleString("en-US")} more` : null);
      return { ...o, payback: pb, lock, affordable: !lock };
    });
  const rank = (o) => (o.lock && !/^Needs \$/.test(o.lock) ? 2 : 0) + (Number.isFinite(o.payback) ? 0 : 1);
  return all.sort((a, b) => rank(a) - rank(b) || a.payback - b.payback || b.gainPerGame - a.gainPerGame);
}

function run(s, a) {
  if (a.type === "train") return train(s, a.pid, a.key, 1);
  if (a.type === "gear") return buyGear(s, a.pid, a.itemId);
  if (a.type === "build") return build(s, a.id);
  if (a.type === "print") return printCard(s, a.pid);
  return false;
}
// Buy an option; the history event remembers what the advisor said it was worth
export function apply(s, o) {
  const h = s.hist;
  const len = h?.spend.length ?? 0, prev = len ? h.spend[len - 1] : null, prevCost = prev?.cost;
  const ok = run(s, o.action);
  if (ok && h) {
    const ev = h.spend[h.spend.length - 1];
    const fresh = h.spend.length > len, merged = !fresh && ev === prev && ev.cost !== prevCost;
    if (fresh) ev.gain = Math.round(o.gainPerGame * 100) / 100;
    else if (merged) ev.gain = Math.round(((ev.gain || 0) + o.gainPerGame) * 100) / 100;
  }
  return ok;
}
