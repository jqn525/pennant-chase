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
import { isOpen } from "./unlocks.js";
import { startBuild, startLock } from "./construction.js";
import { ticketGate } from "./engine.js";
import {
  allPlayers, merchRate, trainCost, trainCeil, buildLock, build, BALLPARK, trackLevel,
  train, buyGear, printCard,
} from "./franchise.js";

// Win rate per rating point, from scripts/calibrate.mjs (40,000 games per run).
// A starter only pitches every fifth game; the setup man pitches most games.
export const WIN_PER_BAT_POINT = 0.0012;
export const WIN_PER_ARM = { SP: 0.00055, RP: 0.00025, CL: 0.0002 };
export const WIN_PER_ARM_POINT = WIN_PER_ARM.SP;
export const winPerPointOf = (p) => (p.role === "bat" ? WIN_PER_BAT_POINT : WIN_PER_ARM[p.pos] ?? WIN_PER_ARM_POINT);
export const HORIZON = 100; // games a new fan keeps paying, for valuing growth
// A win also moves you up the table. The playoff purse (a likely semifinal
// run's share of series pay, game pay and Cup money) times the share of a
// playoff spot one regular-season win is worth in a typical race.
export const PLAYOFF_PURSE = 0.5 * ECON.semisSeriesPay + 3 * ECON.playoffWinPay + 0.25 * ECON.cupPay;
export const RACE_SHARE = 0.03;

const statsOf = (p) => (p.role === "bat" ? BAT_STATS : PIT_STATS);
const winPerPoint = winPerPointOf;

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
  return merchRate(fans, draw, fx.merchMult, fx.tvMult, s.city?.bonus === "merch");
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
    if (s.builds?.[track.id]) return [];
    const lvl = trackLevel(s, track.id);
    const next = track.tiers[lvl];
    if (!next) return [];
    const games = Math.max(1, next.games || 1), perGame = Math.ceil(next.cost / games);
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
      title: `${next.name}`,
      detail: `${games} game${games === 1 ? "" : "s"} to build at $${perGame.toLocaleString("en-US")}/game · ${track.title.charAt(0) + track.title.slice(1).toLowerCase()} ${lvl + 1} · ${why}`,
      lock: startLock(s, track.id), needFans: next.fans, games, perGame, startCost: perGame,
      action: { type: "build", id: track.id },
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
      id: `promo-${p.id}`, kind: "Promote", cost: up.cost, gainPerGame: gain,
      title: `${p.name} · ${up.deal} → ${up.name.toLowerCase()}`,
      detail: s.merch ? `More fame sells more merch · raises trade value · ${p.pos}` : `Pays once you own a merch store · raises trade value · ${p.pos}`,
      action: { type: "print", pid: p.id },
    }];
  });
}

// Every option, best first: buyable by payback, then locked ones
export function options(s) {
  if (!s.roster || s.phase === "draft") return [];
  const vWin = valueOfWin(s);
  const all = [...trainOptions(s, vWin), ...(isOpen(s, "gear") ? gearOptions(s, vWin) : []), ...(isOpen(s, "ballpark") ? buildOptions(s, vWin) : []), ...(isOpen(s, "star") ? printOptions(s) : [])]
    .map((o) => {
      // a build only starts paying once it opens
      const pb = payback(o.cost, o.gainPerGame) + (o.games || 0);
      const need = o.startCost ?? o.cost;
      const lock = o.lock || (s.money < need ? `Needs $${Math.ceil(need - s.money).toLocaleString("en-US")} more` : null);
      return { ...o, payback: pb, lock, affordable: !lock };
    });
  const rank = (o) => (o.lock && !/^Needs \$/.test(o.lock) ? 2 : 0) + (Number.isFinite(o.payback) ? 0 : 1);
  return all.sort((a, b) => rank(a) - rank(b) || a.payback - b.payback || b.gainPerGame - a.gainPerGame);
}

function run(s, a) {
  if (a.type === "train") return train(s, a.pid, a.key, 1);
  if (a.type === "gear") return buyGear(s, a.pid, a.itemId);
  if (a.type === "build") return startBuild(s, a.id);
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
