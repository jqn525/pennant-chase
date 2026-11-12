// ── The franchise: all game state and every GM action, pure of any UI ──
// State is one plain object `s`; actions mutate it in place (the React hook
// copies nothing — it just re-renders after each call). Every dollar moves
// through credit(), so the ledger always explains the bank balance.
// Side effects the UI cares about (sounds, results) are queued on s.events.

import { LEAGUE, ECON, TRADE, BAT_STATS, PIT_STATS, STADIUM, stadiumFx, REVENUE, revenueFx, SALARY, FRANCHISE, CREEP } from "./constants.js";
import { fmt } from "./utils.js";
import { genRoster, genPitcher, genBatter, genCallUp, seedUid, genDraftClass, vetPot, rollPot, pickTrait, freshName, seedNames, creepRival, seedRivalStars, genTeamIdentity } from "./generators.js";
import { newGame, stepAtBat, playGameInstant, settleGame, ticketGate } from "./engine.js";
import { makeRivals, makeSchedule, teamRating, quickSim, simSeries, seedOrder, runOffseason, careerWinter, seriesInfo, assignMarkets, shiftPlayer, marketOffset } from "./season.js";
import { genShipment, genItem, playerValue, GEAR, dealerTier, shipmentWeights, devCapFor, ovr, nameFor } from "./gear.js";
import { nextPrint, cardDraw } from "./cards.js";
import { loadoutById, applyLoadout, sortRival } from "./lineup.js";
import { teamPayroll, luxuryTax } from "./salary.js";
import { checkUnlocks, queueUnlock } from "./unlocks.js";
import { rollAwaySales } from "./merch.js";
import { MAX_RATING, ageOneYear, retireChance, rollTalent, drawAge, drawTier } from "./talent.js";
import { everyone, mapRoster, starterFor, replaceSlot, ROTATION } from "./roster.js";
import { progressBuilds } from "./construction.js";
import { progressTraining, defaultTraining, migrateTraining, rivalTraining } from "./training.js";
import { noteBeats } from "./beats.js";
import { unitRatings } from "./units.js";
import { emptyHist, loadHist, noteGame, noteSpend, trackOvr, noteGameRecords, noteSeasonRecords, closeSeason } from "./history.js";

export const EMPTY_STAT = { g: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, k: 0, r: 0, rbi: 0, outsP: 0, kP: 0, bbP: 0, hP: 0, raP: 0 };
export const FENCE = { corner: LEAGUE.fenceCorner, center: LEAGUE.fenceCenter };
const HOME_BO5 = [1, 1, 0, 0, 1];
const HOME_BO7 = [1, 1, 0, 0, 0, 1, 1];

// Jersey sales per second (see the economy notes in constants.js)
// Merch sold per game played: grows with the fan base and the roster's star power
export const merchRate = (fansN, draw, merchMult, tvMult, merchCity) =>
  0.6 * Math.pow(Math.max(0, fansN), 0.5) * (1 + draw) * merchMult * tvMult * (merchCity ? 1.3 : 1);
export const lvlOf = (v) => (typeof v === "number" ? v : v ? 1 : 0);

// ── Ledger ──
export const LEDGER_LINES = [
  ["gate", "Ticket gate", 1], ["winBonus", "Win bonus", 1], ["merch", "Merch", 1], ["tv", "TV share", 1],
  ["postseason", "Playoff & Cup pay", 1], ["trades", "Trades", 0], ["away", "Away sales", 1],
  ["payroll", "Payroll", -1], ["coaching", "Coaching staff", -1], ["training", "Training", -1], ["gear", "Gear", -1], ["upgrades", "Upgrades", -1],
  ["prints", "Promotions", -1], ["draft", "Draft signings", -1], ["tax", "Luxury tax", -1],
];
const emptyLedger = () => ({ game: {}, lastGame: {}, season: {}, lastSeason: {}, life: {} });
export function credit(s, cat, amount) {
  if (!amount) return;
  s.money += amount;
  for (const b of ["game", "season", "life"]) s.ledger[b][cat] = (s.ledger[b][cat] || 0) + amount;
  if (amount > 0) addAT(s, { earned: amount }); else addAT(s, { spent: -amount });
}
export const ledgerNet = (bucket) => Object.values(bucket || {}).reduce((a, b) => a + b, 0);

// Auto-develop settings (the engine lives in autodev.js); old reserve rules carry over
export const defaultAutoDev = () => ({ on: true, share: 0.4, reserve: 500, allowance: 0 });
export function migrateAutoDev(saved, rules) {
  const d = defaultAutoDev();
  if (saved && typeof saved === "object") return { ...d, ...saved };
  const res = (rules || []).filter((r) => r?.type === "reserve" && !r.off).map((r) => r.n || 0);
  return res.length ? { ...d, reserve: Math.max(...res) } : d;
}

// Winter is view-only: the season is over, only the draft is open
export const inWinter = (s) => s.phase === "draft";
export const WINTER_NOTE = "Winter: the season is over. Close the draft to start the new year.";

// ── Small helpers ──
export const tn = (c) => c?.nickname ?? c?.name ?? "";
export const allPlayers = (s) => (s.roster ? everyone(s.roster) : []);
const findP = (s, pid) => allPlayers(s).find((x) => x.id === pid);
// Book a purchase into history (after the change has been applied)
function spent(s, cat, cost, { pid = null, before = null, what }) {
  if (!s.hist) s.hist = emptyHist();
  const after = pid != null ? findP(s, pid) : null;
  const ev = noteSpend(s.hist, { y: s.year, gi: s.gameIndex, cat, cost, pid, name: (after || before)?.name, what, before, after });
  if (s.roster) trackOvr(s.hist, allPlayers(s));
  return ev;
}
export const stat = (s, id) => s.seasonStats[id] || EMPTY_STAT;
const cityBonus = (s, k) => s.city?.bonus === k;
function addAT(s, patch) {
  for (const k in patch) s.allTime[k] = (s.allTime[k] || 0) + patch[k];
}
export function pushLog(s, text, kind = "play") {
  s.log.unshift({ id: s.logId++, text, kind });
  if (s.log.length > 80) s.log.length = 80;
}
const emit = (s, type, data = {}) => s.events.push({ type, ...data });
const updatePlayer = (s, pid, fn) => {
  const upd = (o) => (o.id === pid ? fn(o) : o);
  s.roster = mapRoster(s.roster, upd);
};

// ── Saves that went through the short-lived Orbital reskin get their old names back ──
// Only display names change; ids, ratings, markets and money are untouched.
function undoLore(s) {
  for (const [id, b] of Object.entries(s.builds || {})) {
    const track = BALLPARK.find((t) => t.id === id);
    const tier = track?.tiers[b.tier];
    if (tier) s.builds[id] = { ...b, name: tier.name, area: track.title.charAt(0) + track.title.slice(1).toLowerCase() };
  }
  const rename = (it) => (it && it.slot ? { ...it, name: nameFor(it.slot, it.rarity, it.id) } : it);
  s.shopItems = (s.shopItems || []).map(rename);
  if (s.roster) s.roster = mapRoster(s.roster, (p) => (p.gear ? { ...p, gear: Object.fromEntries(Object.entries(p.gear).map(([k, it]) => [k, rename(it)])) } : p));
  if (s.rivals) {
    const cities = new Set(s.city ? [s.city.name] : []), names = new Set(s.city ? [s.city.nickname] : []);
    s.rivals = s.rivals.map((t) => { const id = genTeamIdentity(cities, names); return { ...t, name: id.name, tCity: id.tCity }; });
  }
  delete s.lore;
}

// ── Creating and loading ──
export function blankState() {
  return {
    city: null, money: ECON.startMoney, fans: ECON.startFans, roster: null, merch: 0, tv: 0,
    stadium: { parking: 0, seats: 0, conc: 0, lights: 0 }, seasonStats: {}, careerStats: {}, gameLog: {}, lastBox: null, hist: emptyHist(), shopItems: genShipment(),
    draftClass: null, form: [], year: 1, phase: "regular", rivals: null, schedule: null, rivalDays: null,
    gameIndex: 0, standings: Array.from({ length: 8 }, () => ({ w: 0, l: 0 })), playoffs: null,
    history: [], trophies: 0, allTime: {}, capYears: 0, lineupLoadout: "numbers", autoLineup: true,
    speed: 1, sound: true, autoDev: defaultAutoDev(), training: defaultTraining(), unlocked: [], builds: {}, ledger: emptyLedger(), results: [],
    live: null, ctx: null, rest: 0, log: [], logId: 1, events: [], lastSeen: Date.now(),
  };
}

// Saves from the one-starter era: fill out a 5-man rotation and a setup man + closer.
// New arms are pitched a few points under the club's current pitching so a
// developed staff isn't dragged down. Returns true if anything changed.
function migrateStaff(S) {
  const level = (p) => Math.round(ovr(p));
  const reliever = (p) => ({ ...p, stuff: Math.min(LEAGUE.statCap, p.stuff + 4), stamina: Math.max(40, p.stamina - 8) });
  const fill = (r, rival) => {
    if (r.rotation) return false;
    const sp = { ...r.sp, pos: "SP" };
    const base = level(sp);
    const make = (pos, d) => { const p = genPitcher(pos, Math.max(40, base - d)); if (rival) delete p.pot; return p; };
    r.rotation = [sp, ...[3, 4, 5, 7].map((d) => make("SP", d))];
    const setup = r.rp ? { ...r.rp, pos: "RP" } : reliever(make("RP", 5));
    r.pen = [setup, reliever(make("CL", 3))];
    delete r.sp; delete r.rp;
    return true;
  };
  let changed = fill(S.roster, false);
  for (const r of S.rivals || []) changed = fill(r, true) || changed;
  if (changed && S.liveGame) { S.liveGame = null; S.liveContext = null; }
  return changed;
}

// Saves from before careers: give every player an age, a career length and a
// ceiling that fits his age. Better players lean toward their prime; nobody's
// current ratings change. Old ceilings were wildly generous, so they're redrawn.
function migrateCareers(S) {
  const fix = (p) => {
    if (!p || p.age != null) return;
    const o = ovr(p);
    let age = drawAge();
    if (o >= 75 && (age < 25 || age > 33)) age = 26 + ((Math.random() * 6) | 0);
    p.age = age;
    p.years = Math.max(0, age - 22);
    const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
    const room = age <= 21 ? 9 : age <= 26 ? [6, 4, 3, 2, 1][age - 22] : 0;
    p.pot = {};
    for (const k of keys) p.pot[k] = Math.min(MAX_RATING, p[k] + (room ? room + ((Math.random() * 4) | 0) : 0));
  };
  [...everyone(S.roster), ...(S.rivals || []).flatMap((r) => everyone(r)), ...(S.draftClass || [])].forEach(fix);
  (S.draftClass || []).forEach((p) => { if (p.age > 23) { p.age = 21; p.years = 0; } });
}

// Older saves: every one-time migration the game has ever needed
export function loadState(saved) {
  const s = blankState();
  if (!saved?.city) return s;
  const S = saved;
  const oldStaff = (r) => [r.sp, r.rp, ...(r.rotation || []), ...(r.pen || [])].filter(Boolean);
  const ids = [S.roster.batters, oldStaff(S.roster), ...(S.rivals || []).map((r) => [...r.batters, ...oldStaff(r)]), S.draftClass || []].flat();
  seedUid(Math.max(...ids.map((p) => p.id)) + 1);
  const staffed = migrateStaff(S);
  migrateCareers(S);
  // gear was rebalanced to about half strength: scale owned and shop items once
  if ((S.gearScale ?? 1) < 2) {
    const half = (item) => { if (item?.boosts) for (const k in item.boosts) item.boosts[k] = Math.round(item.boosts[k] * 0.55) || Math.sign(item.boosts[k]); };
    [...everyone(S.roster), ...(S.draftClass || [])].forEach((p) => p.gear && Object.values(p.gear).forEach(half));
    (S.shopItems || []).forEach(half);
  }

  const oldScale = S.scale !== 100;
  const toNew = (v) => Math.min(LEAGUE.statCap, v * 4 + 41);
  const upgrade = (p, withPot) => {
    const keys = p.role === "bat" ? BAT_STATS : PIT_STATS;
    if (oldScale) {
      for (const k of keys) p[k] = toNew(p[k]);
      if (p.pot) for (const k of keys) p.pot[k] = toNew(p.pot[k]);
      if (p.signCost) p.signCost = Math.round(p.signCost);
    }
    if (withPot && !p.pot) p.pot = rollPot(p, keys);
    if (!p.trait) p.trait = pickTrait(p.role === "bat" ? "bat" : "pit");
    if (p.gear) for (const def of GEAR) {
      const item = p.gear[def.slot];
      if (typeof item === "number") {
        p.gear[def.slot] = { id: `legacy-${p.id}-${def.slot}`, slot: def.slot, rarity: item, name: `Old Faithful ${def.label}`, boosts: { [def.stat]: item * 5 }, cost: 0 };
      } else if (oldScale && item?.boosts) {
        for (const st in item.boosts) {
          const n = item.boosts[st];
          item.boosts[st] = Math.abs(n) >= 4 ? n : n > 0 ? n * 5 : n === -1 ? -4 : n * 5;
        }
      }
    }
  };
  everyone(S.roster).forEach((p) => upgrade(p, true));
  (S.rivals || []).forEach((r) => everyone(r).forEach((p) => upgrade(p, false)));
  (S.draftClass || []).forEach((p) => upgrade(p, true));
  const allSaved = [...everyone(S.roster), ...(S.rivals || []).flatMap((r) => everyone(r)), ...(S.draftClass || [])];
  if (S.names !== 2) allSaved.forEach((p) => { p.name = freshName(); });
  else seedNames(allSaved.map((p) => p.name));
  if (oldScale && S.shopItems) for (const item of S.shopItems) for (const st in item.boosts) {
    const n = item.boosts[st];
    item.boosts[st] = n > 0 && n <= 3 ? n * 5 : n === -1 ? -4 : n;
  }
  if (S.balance !== 1) {
    const cap = devCapFor(S.trophies || 0);
    everyone(S.roster).forEach((p) => {
      for (const k of p.role === "bat" ? BAT_STATS : PIT_STATS) p[k] = Math.min(p[k], cap);
    });
    (S.rivals || []).forEach(seedRivalStars);
  }
  if (S.econ !== 2) {
    S.fans = Math.round(S.fans * 50);
    S.money = Math.round(S.money * 5);
    (S.draftClass || []).forEach((p) => { if (p.signCost) p.signCost = Math.round(p.signCost * 1.75); });
    (S.shopItems || []).forEach((i) => { i.cost = Math.round(i.cost * 5 / 3); });
    if (S.allTime) for (const k of ["earned", "spent"]) if (S.allTime[k]) S.allTime[k] = Math.round(S.allTime[k] * 5);
    if (S.liveGame) S.liveGame.gatePaid = 0;
  }
  if (S.rivals && !S.liveGame) S.rivals.forEach(sortRival);

  // older saves only built the all-time ledger as they went
  let allTime = S.allTime;
  if (!allTime) {
    let w = S.standings?.[0]?.w || 0, l = S.standings?.[0]?.l || 0;
    for (const h of S.history || []) { const [hw, hl] = (h.playerRecord || "0-0").split("-").map(Number); w += hw || 0; l += hl || 0; }
    allTime = { w, l, g: w + l };
  }
  Object.assign(s, {
    city: S.city, money: S.money, fans: S.fans, roster: S.roster, merch: lvlOf(S.merch), tv: lvlOf(S.tv),
    stadium: S.stadium ?? s.stadium, seasonStats: S.seasonStats ?? {}, careerStats: S.careerStats ?? {}, gameLog: S.gameLog ?? {}, lastBox: S.lastBox ?? null, hist: loadHist(S.hist), shopItems: S.shopItems ?? s.shopItems,
    draftClass: S.draftClass ?? null, form: S.form ?? [], year: S.year ?? 1, phase: S.phase ?? "regular",
    rivals: S.rivals ? assignMarkets(S.rivals) : S.rivals, schedule: S.schedule, rivalDays: S.rivalDays, gameIndex: S.gameIndex ?? 0,
    standings: S.standings ?? s.standings, playoffs: S.playoffs ?? null, history: S.history ?? [],
    trophies: S.trophies ?? 0, allTime, capYears: S.capYears ?? 0,
    lineupLoadout: S.lineupLoadout ?? null, autoLineup: S.autoLineup ?? !!S.lineupLoadout,
    speed: S.speed ?? 1, sound: S.sound ?? true,
    autoDev: migrateAutoDev(S.autoDev, S.rules), training: migrateTraining(S.training), unlocked: Array.isArray(S.unlocked) ? S.unlocked : null, builds: S.builds ?? {}, yearEnd: S.yearEnd ?? null, ledger: S.ledger ? { ...emptyLedger(), ...S.ledger } : emptyLedger(),
    results: S.results ?? [], live: S.liveGame ?? null, ctx: S.liveContext ?? null,
    lastSeen: S.lastSeen ?? Date.now(),
  });
  s.rotationTurn = S.rotationTurn ?? 0;
  // unit ratings at opening day; saves from before the team report start tracking now
  s.unitsStart = S.unitsStart ?? (s.roster ? { ...unitRatings(s.roster), y: s.year, late: true } : null);
  if (S.lore) undoLore(s);
  s.rivalTrainedAt = S.rivalTrainedAt ?? S.gameIndex ?? 0;
  if (staffed) pushLog(s, "The club signs four starters and a closer to fill out a real pitching staff.", "beat");
  return s;
}

export function toSave(s) {
  if (!s.city) return null;
  return {
    version: 3, scale: 100, gearScale: 2, names: 2, econ: 2, balance: 1, lastSeen: Date.now(),
    city: s.city, money: s.money, fans: s.fans, roster: s.roster, merch: s.merch, tv: s.tv, stadium: s.stadium,
    seasonStats: s.seasonStats, careerStats: s.careerStats, gameLog: s.gameLog, lastBox: s.lastBox, hist: s.hist, shopItems: s.shopItems, draftClass: s.draftClass, form: s.form,
    year: s.year, phase: s.phase, rivals: s.rivals, schedule: s.schedule, rivalDays: s.rivalDays,
    gameIndex: s.gameIndex, standings: s.standings, playoffs: s.playoffs, history: s.history,
    trophies: s.trophies, allTime: s.allTime, capYears: s.capYears, speed: s.speed, sound: s.sound,
    lineupLoadout: s.lineupLoadout ?? null, autoLineup: s.autoLineup, autoDev: s.autoDev, training: s.training, unlocked: s.unlocked, builds: s.builds, yearEnd: s.yearEnd, rotationTurn: s.rotationTurn ?? 0, unitsStart: s.unitsStart ?? null, rivalTrainedAt: s.rivalTrainedAt ?? 0, ledger: s.ledger,
    results: s.results.slice(0, 30), liveGame: s.live, liveContext: s.ctx,
  };
}

export function found(s, c) {
  s.city = c;
  s.rivals = makeRivals(LEAGUE.statBase, { tCity: c.name, name: c.nickname });
  // an expansion club starts in the lower half: somewhere between the
  // league's worst and its middle, and climbs from there
  const ratings = s.rivals.map(teamRating).sort((a, b) => a - b);
  const lo = ratings[0] - 1, hi = ratings[2];
  const target = lo + Math.random() * Math.max(0, hi - lo);
  let best = null;
  for (let i = 0; i < 40; i++) {
    const r = genRoster(LEAGUE.statBase);
    if (!best || Math.abs(teamRating(r) - target) < Math.abs(teamRating(best) - target)) best = r;
    if (Math.abs(teamRating(best) - target) < 0.4) break;
  }
  s.roster = best;
  const sch = makeSchedule();
  s.schedule = sch.schedule;
  s.rivalDays = sch.rivalDays;
  if (s.autoLineup) s.roster.batters = applyLoadout(s.roster.batters, s.lineupLoadout || "numbers");
  s.unitsStart = { ...unitRatings(s.roster), y: s.year };
  pushLog(s, `The ${c.name} ${c.nickname} join ${LEAGUE.name}. ${c.label}.`, "win");
}

// ── Passive income ──
export function merchPerGame(s) {
  if (!s.merch || !s.roster) return 0;
  const fx = revenueFx(s.merch, s.tv);
  return merchRate(s.fans, cardDraw(allPlayers(s)), fx.merchMult, fx.tvMult, cityBonus(s, "merch"));
}
// Merch for `games` games played (the TV uplift is booked on its own line)
export function merchTick(s, games = 1) {
  if (!s.merch || !s.roster) return;
  const fx = revenueFx(s.merch, s.tv);
  const base = merchRate(s.fans, cardDraw(allPlayers(s)), fx.merchMult, 1, cityBonus(s, "merch")) * games;
  credit(s, "merch", base);
  if (fx.tvMult > 1) credit(s, "tv", base * (fx.tvMult - 1));
}
export function welcomeBack(s, now = Date.now()) {
  if (!s.city) return;
  // fans keep buying while you're gone: each item's buyers are rolled from the fan base
  const hours = Math.max(0, now - (s.lastSeen || now)) / 3600e3;
  if (s.merch && hours >= 1 / 60) {
    const recent = s.form || [];
    const sale = rollAwaySales({
      fans: s.fans, store: s.merch, hours, tv: s.tv,
      draw: cardDraw(allPlayers(s)), form: recent.length ? recent.filter((f) => f === "W").length / recent.length : 0.5,
      merchCity: cityBonus(s, "merch"),
    });
    const gain = sale.total * ECON.offlineRate;
    if (gain > 0) {
      credit(s, "away", gain);
      const h = Math.floor(hours), m = Math.floor((hours % 1) * 60);
      const what = sale.items.filter((i) => i.count).map((i) => `${fmt(i.count)} ${i.count === 1 ? i.name : i.plural}`).join(", ");
      pushLog(s, `While you were away (${h}h ${m}m) fans bought ${what}: $${fmt(gain)}.`, "beat");
    }
  }
  s.lastSeen = now;
}

// ── Games ──
function flushStats(s, g) {
  const accs = g.statAcc;
  if (!Object.keys(accs).length) return;
  g.statAcc = {};
  const sum = {};
  for (const pid in accs) for (const k in accs[pid]) sum[k] = (sum[k] || 0) + accs[pid][k];
  addAT(s, sum);
  const next = { ...s.seasonStats };
  for (const pid in accs) {
    const cur = { ...(next[pid] || EMPTY_STAT) };
    for (const k in accs[pid]) cur[k] += accs[pid][k];
    next[pid] = cur;
  }
  s.seasonStats = next;
  // this game's running line per player, kept on the game so a mid-game save keeps it
  const la = g.lineAcc || (g.lineAcc = {});
  for (const pid in accs) {
    const cur = la[pid] || (la[pid] = {});
    for (const k in accs[pid]) cur[k] = (cur[k] || 0) + accs[pid][k];
  }
}

// Career = banked past seasons + the season in progress
const addCounts = (a, b) => { const o = { ...EMPTY_STAT, ...a }; for (const k in b) o[k] = (o[k] || 0) + b[k]; return o; };
export const careerOf = (s, pid) => addCounts(s.careerStats?.[pid], s.seasonStats[pid] || {});
export const GAME_LOG_LEN = 20;

// Bank this game's per-player lines into the game log and the last box score
function logGame(s, g, won, playoffLabel) {
  const label = playoffLabel ? (playoffLabel === "CUP" ? "Final" : "Semi") : `G${s.gameIndex + 1}`;
  const head = { year: s.year, game: label, opp: g.opp.name, home: g.home, won, us: g.us, them: g.them };
  const lines = {};
  const log = { ...(s.gameLog || {}) };
  for (const pid in g.lineAcc || {}) {
    const line = { ...EMPTY_STAT, ...g.lineAcc[pid], g: 1 };
    lines[pid] = line;
    log[pid] = [{ ...head, ...line }, ...(log[pid] || [])].slice(0, GAME_LOG_LEN);
  }
  s.gameLog = log;
  s.lastBox = { ...head, lines };
  // games played
  const ss = { ...s.seasonStats };
  for (const pid in lines) ss[pid] = { ...(ss[pid] || EMPTY_STAT), g: ((ss[pid] || {}).g || 0) + 1 };
  s.seasonStats = ss;
}
const ratingsNow = (s) => [teamRating(s.roster), ...s.rivals.map(teamRating)];

export function gateNow(s) {
  const fx = stadiumFx(s.stadium);
  return ticketGate({
    fans: s.fans, playoff: s.phase === "playoffs", formWins: s.form.filter((f) => f === "W").length,
    attCap: fx.attCap, rateBonus: fx.rateBonus, gateBonus: cityBonus(s, "gate"), gateMult: fx.gateMult,
  });
}

function startNextGame(s) {
  let oppIdx, home, label;
  if (s.phase === "playoffs") {
    const p = s.playoffs;
    const pattern = p.round === "semi" ? HOME_BO5 : HOME_BO7;
    const higherHome = pattern[p.gameNo] === 1;
    home = p.weAreHigherSeed ? higherHome : !higherHome;
    oppIdx = p.opp;
    label = `${p.round === "semi" ? "Semifinal" : "Pennant Cup"} game ${p.gameNo + 1} (series ${p.wins.us}–${p.wins.them})`;
  } else {
    const d = s.schedule[s.gameIndex];
    oppIdx = d.opp; home = d.home;
    label = `Game ${s.gameIndex + 1} of ${LEAGUE.seasonGames}`;
  }
  const opp = s.rivals[oppIdx - 1];
  s.live = newGame(opp, home, oppIdx);
  // starters take turns; each rival's turn follows its own games played
  const turn = s.rotationTurn || 0;
  s.rotationTurn = turn + 1;
  const oppTurn = s.standings[oppIdx].w + s.standings[oppIdx].l + (s.phase === "playoffs" ? s.playoffs.gameNo : 0);
  s.ctx = {
    batters: s.roster.batters, opp,
    staff: { sp: starterFor(s.roster, turn), setup: s.roster.pen[0], closer: s.roster.pen[1] },
    oppStaff: { sp: starterFor(opp, oppTurn), setup: opp.pen[0], closer: opp.pen[1] },
    fence: FENCE, statBase: LEAGUE.statBase, innings: LEAGUE.innings, cityName: tn(s.city),
  };
  s.ledger.lastGame = s.ledger.game;
  s.ledger.game = {};
  pushLog(s, `${label}: ${home ? `${opp.name} at ${tn(s.city)}` : `${tn(s.city)} at ${opp.name}`}.`, "sys");
}

export function settle(s, g) {
  if (g.settled) return;
  g.settled = true;
  const gi = s.phase === "playoffs" ? s.playoffs.gameNo : s.gameIndex;
  const playoffLabel = s.phase === "playoffs" ? (s.playoffs.round === "semi" ? "SEMIS" : "CUP") : null;
  let streak = 0;
  for (let i = s.form.length - 1; i >= 0 && s.form[i] === "W"; i--) streak++;
  const res = settleGame(g, {
    fans: s.fans, gateBonus: cityBonus(s, "gate"), floorBonus: cityBonus(s, "floor"),
    fansBonus: cityBonus(s, "fans"), cityName: tn(s.city), playoff: playoffLabel,
    formWins: s.form.filter((f) => f === "W").length, streak, ...stadiumFx(s.stadium),
  });
  // split what's left of the gate (ticket drip already paid live) from the win/loss bonus
  const fx = stadiumFx(s.stadium);
  const bonus = (res.won ? ECON.gateWinBase : ECON.gateLossBase * (cityBonus(s, "floor") ? 2 : 1)) * fx.gateMult;
  const playoffPay = playoffLabel && res.won ? ECON.playoffWinPay : 0;
  const rest = res.moneyDelta - playoffPay;
  credit(s, "winBonus", Math.min(rest, bonus));
  credit(s, "gate", Math.max(0, rest - bonus));
  credit(s, "postseason", playoffPay);
  // payroll drips per regular-season game; it defers rather than overdraw
  if (s.phase === "regular") {
    const wage = Math.round(teamPayroll(s.roster) / LEAGUE.seasonGames);
    credit(s, "payroll", -Math.min(wage, Math.max(0, s.money)));
  }
  addAT(s, { g: 1, [res.won ? "w" : "l"]: 1, tickets: res.attendance });
  merchTick(s, 1);
  progressBuilds(s);
  progressTraining(s);
  if (res.fansDelta) s.fans += res.fansDelta;
  flushStats(s, g);
  logGame(s, g, res.won, playoffLabel);
  s.form = [...s.form, res.won ? "W" : "L"].slice(-10);
  s.results.unshift({ won: res.won, us: g.us, them: g.them, opp: g.opp.name, home: g.home, gate: res.attendance, net: ledgerNet(s.ledger.game), fans: res.fansDelta, year: s.year, playoff: playoffLabel });
  if (s.results.length > 60) s.results.length = 60;
  pushLog(s, res.text, res.kind);
  emit(s, "final", { won: res.won });

  if (s.phase === "regular") {
    const next = s.standings.map((t) => ({ ...t }));
    next[0][res.won ? "w" : "l"]++;
    next[g.oppIdx][res.won ? "l" : "w"]++;
    const ratings = ratingsNow(s);
    for (const [a, b] of s.rivalDays[s.gameIndex]) {
      const aWin = quickSim(ratings[a], ratings[b], true);
      next[aWin ? a : b].w++;
      next[aWin ? b : a].l++;
    }
    s.standings = next;
    s.gameIndex++;
    stretchRun(s);
  } else {
    const p = { ...s.playoffs, wins: { ...s.playoffs.wins }, gameNo: s.playoffs.gameNo + 1 };
    res.won ? p.wins.us++ : p.wins.them++;
    s.playoffs = p;
  }
  // history: one row per game, overall change points, records
  if (!s.hist) s.hist = emptyHist();
  const ratings = ratingsNow(s);
  const head = { y: s.year, gi, playoff: playoffLabel, won: res.won, us: g.us, them: g.them, home: g.home, opp: g.opp.name,
    cash: s.money, fans: s.fans, att: res.attendance, led: s.ledger.game, tr: ratings[0], place: seedOrder(s.standings, ratings).indexOf(0) + 1 };
  noteGame(s.hist, head);
  trackOvr(s.hist, allPlayers(s));
  const broken = noteGameRecords(s.hist, s.lastBox?.lines || {}, { ...head, gate: Math.round(s.ledger.game.gate || 0) });
  let run = 0;
  for (let i = s.form.length - 1; i >= 0 && s.form[i] === "W"; i--) run++;
  for (const line of noteBeats(s, { att: res.attendance, attCap: stadiumFx(s.stadium).attCap, streak: run, broken })) pushLog(s, line, "beat");
  openUnlocks(s);
}

// The year in one card, captured before winter wipes the season's stats
function yearReview(s, { w, l, finish, champion, cup }) {
  const players = allPlayers(s);
  const ops = (x) => (x.ab ? (x.h + x.bb) / (x.ab + x.bb) + (x.h + x.d + 2 * x.t + 3 * x.hr) / x.ab : 0);
  const hitters = s.roster.batters.map((p) => ({ p, st: s.seasonStats[p.id] })).filter((x) => x.st && x.st.ab >= 100);
  const top = hitters.sort((a, b) => ops(b.st) - ops(a.st))[0];
  const arms = [...s.roster.rotation, ...s.roster.pen].map((p) => ({ p, st: s.seasonStats[p.id] })).filter((x) => x.st && x.st.outsP >= 90);
  const ace = arms.sort((a, b) => a.st.raP / a.st.outsP - b.st.raP / b.st.outsP)[0];
  const h = s.hist;
  const startN = (h.games.find((r) => r[1] === s.year)?.[0] ?? 1) - 1;
  let riser = null;
  for (const p of players) {
    const pts = h.ovr[p.id] || [];
    const before = [...pts].reverse().find((x) => x[0] <= startN) || pts[0];
    const gain = pts.length && before ? (pts[pts.length - 1][1] - before[1]) / 10 : 0;
    if (gain > 0 && (!riser || gain > riser.gain)) riser = { name: p.name, pos: p.pos, gain: Math.round(gain * 10) / 10 };
  }
  const buys = h.spend.filter((e) => e.y === s.year && e.gain > 0);
  const best = buys.map((e) => ({ e, ret: e.gain * Math.max(0, h.n - (e.proj ? e.doneN ?? h.n : e.n)) / e.cost })).sort((a, b) => b.ret - a.ret)[0];
  return {
    y: s.year, w, l, finish, champion, cup, net: Math.round(ledgerNet(s.ledger.season)),
    spent: Math.round(h.spend.filter((e) => e.y === s.year).reduce((t, e) => t + e.cost, 0)),
    fans: Math.round(s.fans),
    hitter: top && { name: top.p.name, pos: top.p.pos, ops: ops(top.st).toFixed(3).replace(/^0/, ""), hr: top.st.hr },
    pitcher: ace && { name: ace.p.name, era: ((ace.st.raP * 27) / ace.st.outsP).toFixed(2), k: ace.st.kP },
    riser,
    bestBuy: best && best.ret > 0 ? { what: best.e.what, name: best.e.name, cost: best.e.cost, back: Math.round(best.ret * 100) } : null,
  };
}
export function closeYearEnd(s) { s.yearEnd = null; }

// The end of the regular season shouldn't sneak up on you
export const gamesLeft = (s) => (s.phase === "regular" ? LEAGUE.seasonGames - s.gameIndex : 0);
function slowDown(s, why) {
  if (s.speed !== "max") return;
  s.speed = 4;
  pushLog(s, `Slowing to 4× ${why}. Tap MAX to speed back up.`, "beat");
  emit(s, "slow");
}
function stretchRun(s) {
  const left = gamesLeft(s);
  const b = s.hist?.beats || (s.hist && (s.hist.beats = {}));
  if (left === 10) pushLog(s, "10 games left in the regular season. Last chance to set up for the stretch run.", "beat");
  if (left === 3) slowDown(s, "for the last three games of the season");
  if (left === 0) pushLog(s, "That's the regular season.", "beat");
  // clinched or out: nobody can catch you, or you can't catch 4th
  if (b && left > 0 && b.raceY !== s.year) {
    const ratings = ratingsNow(s);
    const order = seedOrder(s.standings, ratings);
    const me = s.standings[0].w, mySeed = order.indexOf(0);
    const fifth = s.standings[order[LEAGUE.playoffTeams]], fourth = s.standings[order[LEAGUE.playoffTeams - 1]];
    if (mySeed < LEAGUE.playoffTeams && me > fifth.w + left) { b.raceY = s.year; pushLog(s, `Clinched: the ${s.city.nickname} are in the playoffs.`, "beat"); }
    else if (mySeed >= LEAGUE.playoffTeams && me + left < fourth.w) { b.raceY = s.year; pushLog(s, "Eliminated from the playoff race. Build for next year.", "beat"); }
  }
}

// Rival clubs shop for gear too: now and then a player gets a better piece
function equipRival(team) {
  const all = everyone(team);
  const p = all[(Math.random() * all.length) | 0];
  const slots = GEAR.filter((g) => (g.role === "bat") === (p.role === "bat"));
  const def = slots[(Math.random() * slots.length) | 0];
  const rarity = Math.random() < 0.7 ? 1 : Math.random() < 0.85 ? 2 : 3;
  const cur = p.gear?.[def.slot];
  if (cur && cur.rarity >= rarity) return team;
  const item = genItem(rarity, def);
  return replaceSlot(team, p.id, { ...p, gear: { ...(p.gear || {}), [def.slot]: item } });
}

// A rival front office upgrades its weakest spot with a prime-age player
function acquire(team) {
  const all = everyone(team);
  const weakest = all.reduce((a, b) => (ovr(b) < ovr(a) ? b : a));
  const opts = { tier: drawTier(0.8), age: 26 + ((Math.random() * 5) | 0) };
  const pos = weakest.pos;
  const pitcher = weakest.role !== "bat";
  const fresh = shiftPlayer(pitcher ? genPitcher(pos, 0, opts) : genBatter(pos, 0, opts), marketOffset(team));
  if (ovr(fresh) <= ovr(weakest)) return team;
  return sortRival(replaceSlot(team, weakest.id, { ...fresh, pos, gear: undefined }));
}

// New systems open as the club grows; each gets one news line
export function openUnlocks(s) {
  for (const u of checkUnlocks(s)) {
    if (u.news) pushLog(s, u.news, "beat");
    emit(s, "unlock", { id: u.id });
    if (u.sheet) { queueUnlock(s, u); slowDown(s, "so you can look at what just opened"); }
  }
}

// One at-bat at watchable speeds; the ticket gate drips per half-inning
export function liveStep(s) {
  const g = s.live;
  const prevHalf = g.half, prevInning = g.inning;
  const ev = [];
  stepAtBat(g, s.ctx, ev);
  ev.forEach((e) => { if (e.kind === "hr") emit(s, "homer"); });
  // the last few plays, in prose, for the Overview ticker
  if (ev.length) g.feed = [...ev.map((e) => ({ i: prevInning, h: prevHalf, t: e.text, k: e.kind, us: e.side === "us" || undefined })).reverse(), ...(g.feed || [])].slice(0, 8);
  flushStats(s, g);
  if (!g.over && (g.half !== prevHalf || g.inning !== prevInning)) {
    const drip = gateNow(s).gate / (LEAGUE.innings * 2);
    g.gatePaid = (g.gatePaid || 0) + drip;
    credit(s, "gate", drip);
  }
  if (g.over) settle(s, g);
}

export function advance(s) {
  if (!s.roster || !s.rivals || !s.schedule) return;
  if (s.phase === "draft") return;
  if (s.phase === "regular") {
    if (s.gameIndex >= LEAGUE.seasonGames) return enterPlayoffs(s);
    if (s.gameIndex > 0) {
      const prev = s.schedule[s.gameIndex - 1], next = s.schedule[s.gameIndex];
      if (prev.opp !== next.opp || prev.home !== next.home) {
        restock(s, false);
        // rivals train between series in their own coach lanes (sized by market), sign and shop;
        // only clubs far behind the league's best get a little extra push
        const games = Math.max(0, s.gameIndex - (s.rivalTrainedAt ?? 0));
        s.rivalTrainedAt = s.gameIndex;
        const rv = s.rivals.map(teamRating).sort((a, b) => a - b), mid = rv[3];
        s.rivals = s.rivals.map((t) => {
          const gap = mid - teamRating(t);
          let team = rivalTraining(t, games);
          if (gap > CREEP.farBehind) team = creepRival(team, Math.round((gap - CREEP.farBehind) * CREEP.seriesRubber), CREEP.seriesBump);
          if (gap > 2 && Math.random() < CREEP.acquire) team = acquire(team);
          if (Math.random() < CREEP.gear) team = equipRival(team);
          return team;
        });
      }
    }
    return startNextGame(s);
  }
  const p = s.playoffs;
  if (!p) return;
  const need = p.round === "semi" ? 3 : 4;
  if (p.wins.us < need && p.wins.them < need) return startNextGame(s);
  const ratings = ratingsNow(s);
  if (p.wins.us >= need && p.round === "semi") {
    credit(s, "postseason", ECON.semisSeriesPay);
    pushLog(s, `Semifinal won ${p.wins.us}–${p.wins.them}: $${fmt(ECON.semisSeriesPay)} series bonus. The final vs the ${s.rivals[p.otherWinner - 1].name} begins.`, "win");
    const order = seedOrder(s.standings, ratings);
    s.playoffs = { round: "final", opp: p.otherWinner, wins: { us: 0, them: 0 }, gameNo: 0, weAreHigherSeed: order.indexOf(0) < order.indexOf(p.otherWinner) };
    restock(s, false);
    return;
  }
  if (p.wins.us >= need && p.round === "final") {
    pushLog(s, `PENNANT CUP CHAMPIONS. ${tn(s.city)} take the final ${p.wins.us}–${p.wins.them}.`, "win");
    if (s.trophies === 0) pushLog(s, "MAX speed unlocked.", "win");
    emit(s, "cup");
    return offseason(s, 0, true);
  }
  if (p.round === "semi") {
    pushLog(s, `Semifinal lost ${p.wins.them}–${p.wins.us}.`, "out");
    const champ = simSeries(ratings[p.otherWinner], ratings[p.opp], 7) ? p.otherWinner : p.opp;
    return offseason(s, champ, false);
  }
  pushLog(s, `Pennant Cup final lost ${p.wins.them}–${p.wins.us}.`, "out");
  return offseason(s, p.opp, false);
}

function enterPlayoffs(s) {
  const ratings = ratingsNow(s);
  const order = seedOrder(s.standings, ratings);
  const mySeed = order.indexOf(0);
  const name = (i) => (i === 0 ? tn(s.city) : s.rivals[i - 1].name);
  pushLog(s, `Regular season complete: ${s.standings[0].w}–${s.standings[0].l}, ${["1st", "2nd", "3rd"][mySeed] || `${mySeed + 1}th`}.`, mySeed < LEAGUE.playoffTeams ? "win" : "out");
  if (mySeed < LEAGUE.playoffTeams) {
    const oppIdx = order[[3, 2, 1, 0][mySeed]];
    const others = order.slice(0, 4).filter((t) => t !== 0 && t !== oppIdx);
    const otherWinner = simSeries(ratings[others[0]], ratings[others[1]], 5) ? others[0] : others[1];
    pushLog(s, `Playoffs: best-of-5 semifinal vs the ${name(oppIdx)}. The ${name(otherWinner)} win the other semi.`, "sys");
    s.playoffs = { round: "semi", opp: oppIdx, wins: { us: 0, them: 0 }, gameNo: 0, otherWinner, weAreHigherSeed: mySeed < order.indexOf(oppIdx) };
    s.phase = "playoffs";
    slowDown(s, "for the playoffs");
    restock(s, false);
  } else {
    const top = order.slice(0, 4);
    const w1 = simSeries(ratings[top[0]], ratings[top[3]], 5) ? top[0] : top[3];
    const w2 = simSeries(ratings[top[1]], ratings[top[2]], 5) ? top[1] : top[2];
    const champ = simSeries(ratings[w1], ratings[w2], 7) ? w1 : w2;
    pushLog(s, `No playoffs this year. The ${name(champ)} win the Pennant Cup.`, "out");
    offseason(s, champ, false);
  }
}

export const currentDealerTier = (s) => dealerTier(
  s.trophies, s.trophies > 0 || s.phase === "playoffs" || (s.history || []).some((h) => h.finish <= LEAGUE.playoffTeams));

export function restock(s, mega) {
  const items = genShipment(6, shipmentWeights(currentDealerTier(s), mega));
  if (mega && s.year === 1 && !items.some((i) => i.rarity === 3)) items[items.length - 1] = genItem(3);
  s.shopItems = items;
  const legendary = items.filter((i) => i.rarity === 3).map((i) => i.name);
  pushLog(s, `New gear shipment${mega ? " (winter catalog)" : ""}${legendary.length ? `, including ${legendary.join(" and ")}` : ""}.`, "sys");
}

function offseason(s, championIdx, playerCup) {
  const final = { w: s.standings[0].w, l: s.standings[0].l };
  const ratings = ratingsNow(s);
  const order = seedOrder(s.standings, ratings);
  const mySeed = order.indexOf(0);
  const off = runOffseason({
    year: s.year, rivals: s.rivals, standings: s.standings, ratings,
    championIdx, championName: championIdx === 0 ? tn(s.city) : s.rivals[championIdx - 1].name,
    playerSeed: mySeed, playerCup, seedOrder: order,
    record: { w: s.standings[0].w, l: s.standings[0].l },
    fans: s.fans, history: s.history, trophies: s.trophies,
  });
  if (playerCup) credit(s, "postseason", ECON.cupPay);
  const payroll = teamPayroll(s.roster);
  const { overage, tax } = luxuryTax(payroll, s.capYears + 1);
  if (overage > 0) {
    s.capYears++;
    const paid = Math.min(Math.round(s.money), tax);
    credit(s, "tax", -paid);
    spent(s, "tax", paid, { what: "Luxury tax" });
    pushLog(s, `Luxury tax: payroll $${fmt(payroll)} is over the $${fmt(SALARY.cap)} cap. Billed $${fmt(tax)}${paid < tax ? ` (the vault covered $${fmt(paid)})` : ""}.`, "out");
  } else if (s.capYears > 0) {
    s.capYears = 0;
    pushLog(s, "Payroll is back under the cap.", "sys");
  }
  s.fans = Math.max(ECON.startFans, s.fans + off.fansDelta);
  s.rivals = off.rivals;
  // careers: a year older, some grow, some fade, some retire
  const winter = careerWinter(s.roster, genCallUp);
  s.roster = winter.team;
  for (const r of winter.retired) {
    pushLog(s, `${r.old.name} (${r.old.age}) retires after ${r.old.years} season${r.old.years === 1 ? "" : "s"}. ${r.next.name} (${r.next.age}) is called up to take his spot.`, "beat");
  }
  for (const r of (off.rivalRetired || []).filter((x) => ovr(x.old) >= 72).slice(0, 3)) {
    pushLog(s, `Around the league: ${r.old.name} of the ${r.club} retires at ${r.old.age}.`, "sys");
  }
  s.schedule = off.schedule;
  s.rivalDays = off.rivalDays;
  s.gameIndex = 0;
  s.rivalTrainedAt = 0;
  s.standings = off.standings;
  s.playoffs = null;
  s.history = off.history;
  s.trophies = off.trophies;
  if (!s.hist) s.hist = emptyHist();
  const last = off.history[off.history.length - 1] || {};
  noteSeasonRecords(s.hist, s.year, s.seasonStats, Object.fromEntries(allPlayers(s).map((p) => [p.id, p.name])));
  closeSeason(s.hist, { y: s.year, w: final.w, l: final.l, finish: last.finish ?? mySeed + 1, cup: !!playerCup,
    champion: last.champion, ledger: s.ledger.season, fans: s.fans });
  s.yearEnd = yearReview(s, { w: final.w, l: final.l, finish: last.finish ?? mySeed + 1, champion: last.champion, cup: !!playerCup });
  const bank = { ...(s.careerStats || {}) };
  for (const pid in s.seasonStats) bank[pid] = addCounts(bank[pid], s.seasonStats[pid]);
  s.careerStats = bank;
  s.seasonStats = {};
  s.form = [];
  s.year = off.year;
  s.live = null;
  s.ctx = null;
  s.ledger.lastSeason = s.ledger.season;
  s.ledger.season = {};
  off.logs.forEach((l) => pushLog(s, l.text, l.kind));
  pushLog(s, "Winter: every player loses a step. Train, shop and reload.", "sys");
  restock(s, true);
  s.draftClass = genDraftClass(mySeed);
  s.phase = "draft";
  emit(s, "draft");
  pushLog(s, "Draft day: the rookie class is on the board. The season waits for you.", "win");
}

// One interval step of the season loop (1×, 4× or MAX)
export function tick(s, speed) {
  if (!s.city) return;
  if (speed === "max") {
    if (s.live && !s.live.over) { playGameInstant(s.live, s.ctx); settle(s, s.live); return; }
    advance(s);
    if (s.live && !s.live.over) { playGameInstant(s.live, s.ctx); settle(s, s.live); }
    return;
  }
  if (s.live && !s.live.over) liveStep(s);
  else if (s.rest > 0) s.rest--;
  else { advance(s); s.rest = speed === 4 ? 1 : 2; }
}

// ── Training ──
export function trainCost(s, p, key) {
  let c = ECON.trainBase * Math.pow(1.5, (p[key] - 41) / 4);
  if (p[key] >= ECON.eliteAt) c *= Math.pow(ECON.eliteRamp, p[key] - ECON.eliteAt);
  // the last few points before his ceiling are the hardest to find
  const gap = (p.pot?.[key] ?? p[key] + 10) - p[key];
  if (gap <= 5) c *= 1 + ECON.lastPoints * (5 - Math.max(0, gap) + 1) / 5;
  if (cityBonus(s, "train")) c *= 0.85;
  return Math.ceil(c);
}
// Training stops at the player's own ceiling; a franchise tag buys 4 more
export const trainCeil = (s, p, key) => {
  const pot = p.pot?.[key] ?? p[key];
  return Math.min(MAX_RATING, pot + (p.franchise ? 4 : 0));
};
export function planTraining(s, p, keys, budget, maxPoints = Infinity) {
  const cur = {};
  keys.forEach((k) => { cur[k] = p[k]; });
  const points = {};
  let total = 0, count = 0;
  while (count < maxPoints) {
    let best = null, bestCost = Infinity;
    for (const k of keys) {
      if (cur[k] >= trainCeil(s, p, k)) continue;
      const c = trainCost(s, { ...p, [k]: cur[k] }, k);
      if (c < bestCost) { best = k; bestCost = c; }
    }
    if (!best || total + bestCost > budget) break;
    cur[best]++;
    points[best] = (points[best] || 0) + 1;
    total += bestCost;
    count++;
  }
  return { points, total, count };
}
// A finished training program: the point lands; its cost was paid game by game
export function landTraining(s, pid, key, cost, auto) {
  const before = findP(s, pid);
  if (!before) return null;
  addAT(s, { train: 1 });
  updatePlayer(s, pid, (o) => ({ ...o, [key]: Math.min(Math.max(o[key], trainCeil(s, o, key)), o[key] + 1) }));
  afterRosterChange(s);
  const ev = spent(s, "training", cost, { pid, before, what: `${key} +1` });
  if (ev && auto) ev.auto = true;
  emit(s, "cash");
  return ev;
}
// A stat moves outside training (rust); `extra` can stamp the player
export function nudgeStat(s, pid, key, d, extra = (q) => q) {
  updatePlayer(s, pid, (o) => extra({ ...o, [key]: o[key] + d }));
  afterRosterChange(s);
  if (s.hist && s.roster) trackOvr(s.hist, allPlayers(s));
}

// ── Franchise tags, cards ──
export const franchiseSlots = (s) => FRANCHISE.slots + s.trophies;
export const franchiseUsed = (s) => allPlayers(s).filter((p) => p.franchise).length;
export function tagFranchise(s, pid) {
  if (inWinter(s)) return false;
  if (franchiseUsed(s) >= franchiseSlots(s)) return false;
  updatePlayer(s, pid, (o) => (o.franchise ? o : { ...o, franchise: true }));
  const p = allPlayers(s).find((x) => x.id === pid);
  pushLog(s, `${p.name} is now a franchise player and can train past the league cap.`, "win");
  return true;
}
export function printCard(s, pid) {
  if (inWinter(s)) return false;
  const p = allPlayers(s).find((x) => x.id === pid);
  const up = p && nextPrint(p);
  if (!up || s.money < up.cost) return false;
  credit(s, "prints", -up.cost);
  addAT(s, { prints: 1 });
  updatePlayer(s, pid, (o) => ({ ...o, cardTier: up.id }));
  spent(s, "prints", up.cost, { pid, before: p, what: `${up.deal} · ${up.name.toLowerCase()}` });
  pushLog(s, `${p.name} is now a ${up.name.toLowerCase()}: ${up.blurb}.`, "win");
  emit(s, "cash");
  return true;
}

// ── Lineup ──
export function afterRosterChange(s) {
  if (s.autoLineup && s.lineupLoadout) s.roster = { ...s.roster, batters: applyLoadout(s.roster.batters, s.lineupLoadout) };
}
export function moveBatter(s, id, dir) {
  const b = [...s.roster.batters];
  const i = b.findIndex((p) => p.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= b.length) return false;
  [b[i], b[j]] = [b[j], b[i]];
  s.roster = { ...s.roster, batters: b };
  s.lineupLoadout = null;
  s.autoLineup = false;
  return true;
}
export function chooseLoadout(s, id) {
  if (!loadoutById(id)) return false;
  s.roster = { ...s.roster, batters: applyLoadout(s.roster.batters, id) };
  s.lineupLoadout = id;
  s.autoLineup = true;
  return true;
}

// ── Gear ──
export function buyGear(s, pid, itemId) {
  if (inWinter(s)) return false;
  const item = s.shopItems.find((i) => i.id === itemId);
  const def = item && GEAR.find((d) => d.slot === item.slot);
  const p = allPlayers(s).find((x) => x.id === pid);
  if (!item || !p || s.money < item.cost) return false;
  if ((def.role === "bat") !== (p.role === "bat")) return false;
  credit(s, "gear", -item.cost);
  addAT(s, { gear: 1 });
  s.shopItems = s.shopItems.filter((i) => i.id !== itemId);
  updatePlayer(s, pid, (o) => ({ ...o, gear: { ...(o.gear || {}), [item.slot]: item } }));
  afterRosterChange(s);
  spent(s, "gear", item.cost, { pid, before: p, what: item.name });
  pushLog(s, `${p.name} equips ${item.name}.`, "win");
  emit(s, "cash");
  return true;
}

// ── Trades ──
export function tradeCounterpart(s, p, rivalIdx) {
  const team = s.rivals?.[rivalIdx];
  if (!team) return null;
  if (p.role === "bat") return team.batters.find((b) => b.pos === p.pos) || null;
  // pitchers trade slot for slot: SP3 for their SP3, setup for setup, closer for closer
  const i = s.roster.rotation.findIndex((x) => x.id === p.id);
  if (i >= 0) return team.rotation[i] || null;
  const j = s.roster.pen.findIndex((x) => x.id === p.id);
  return j >= 0 ? team.pen[j] || null : null;
}
// The draft pick a rookie would replace: his position, or the weakest arm in his role
export function rookieReplaces(s, rook) {
  if (rook.pos === "SP") return [...s.roster.rotation].sort((a, b) => ovr(a) - ovr(b))[0];
  if (rook.pos === "RP") return s.roster.pen[0];
  if (rook.pos === "CL") return s.roster.pen[1];
  return s.roster.batters.find((b) => b.pos === rook.pos);
}
export function tradeQuote(s, p, rivalIdx) {
  const q = tradeCounterpart(s, p, rivalIdx);
  if (!q) return null;
  const diff = playerValue(q, TRADE.valuePerOvr) - playerValue(p, TRADE.valuePerOvr);
  return { them: q, cash: Math.round((diff > 0 ? diff * TRADE.buyPremium : diff * TRADE.sellDiscount) + TRADE.fee) };
}
export function makeTrade(s, myPid, rivalIdx) {
  if (inWinter(s)) return false;
  const p = allPlayers(s).find((x) => x.id === myPid);
  const quote = p && tradeQuote(s, p, rivalIdx);
  if (!p || !quote || s.money < quote.cash) return false;
  const q = quote.them;
  const incoming = { ...q, pot: vetPot(q, p.role === "bat" ? BAT_STATS : PIT_STATS) };
  credit(s, "trades", -quote.cash);
  addAT(s, { trades: 1 });
  s.roster = replaceSlot(s.roster, myPid, incoming);
  s.rivals = s.rivals.map((team, i) => (i !== rivalIdx ? team : replaceSlot(team, q.id, { ...p, pos: q.pos })));
  afterRosterChange(s);
  if (quote.cash > 0) spent(s, "trades", quote.cash, { pid: incoming.id, before: p, what: `${p.name} for ${q.name}` });
  pushLog(s, `Trade: ${p.name} to the ${s.rivals[rivalIdx].name} for ${q.name}${quote.cash > 0 ? ` plus $${fmt(quote.cash)}` : quote.cash < 0 ? `; they add $${fmt(-quote.cash)}` : ""}.`, "win");
  emit(s, "cash");
  return true;
}

// ── Draft ──
export function signRookie(s, rid) {
  const rook = s.draftClass?.find((p) => p.id === rid);
  if (!rook || s.money < rook.signCost) return false;
  const released = rookieReplaces(s, rook);
  if (!released) return false;
  credit(s, "draft", -rook.signCost);
  addAT(s, { rookies: 1 });
  s.draftClass = s.draftClass.filter((p) => p.id !== rid);
  const signed = { ...rook, gear: released.gear };
  s.roster = replaceSlot(s.roster, released.id, signed);
  afterRosterChange(s);
  spent(s, "draft", rook.signCost, { pid: rook.id, before: released, what: `Signed ${rook.name} (${rook.pos})` });
  pushLog(s, `Signed ${rook.name} (${rook.pos}) for $${fmt(rook.signCost)}${released ? `; ${released.name} is released` : ""}.`, "win");
  emit(s, "cash");
  return true;
}
export function closeDraft(s) {
  s.draftClass = null;
  s.phase = "regular";
  if (s.roster) s.unitsStart = { ...unitRatings(s.roster), y: s.year };
  pushLog(s, `Opening day, year ${s.year}.`, "sys");
}

// ── Ballpark: stadium and revenue tracks share one path ──
export const BALLPARK = [...STADIUM.map((t) => ({ ...t, group: "stadium" })), ...REVENUE.map((t) => ({ ...t, group: "revenue" }))];
export const trackLevel = (s, id) => (id === "merch" ? s.merch : id === "tv" ? s.tv : s.stadium[id] || 0);
export function buildLock(s, id) {
  const track = BALLPARK.find((t) => t.id === id);
  const next = track?.tiers[trackLevel(s, id)];
  if (!next) return "Fully built";
  if (id === "tv" && s.merch < 1) return "Needs a merch store first";
  if (s.fans < next.fans) return `Needs ${fmt(next.fans)} fans`;
  if (s.money < next.cost) return `Needs $${fmt(next.cost - s.money)} more`;
  return null;
}
// Instant build (setup and tests); players build through construction.js
export function build(s, id) {
  if (buildLock(s, id)) return false;
  const track = BALLPARK.find((t) => t.id === id);
  const lvl = trackLevel(s, id);
  const next = track.tiers[lvl];
  credit(s, "upgrades", -next.cost);
  spent(s, "upgrades", next.cost, { what: `${next.name} (${track.title.charAt(0) + track.title.slice(1).toLowerCase()} ${lvl + 1})` });
  completeBuild(s, id);
  emit(s, "cash");
  return true;
}
// Raise a track one level (construction finished)
export function completeBuild(s, id) {
  const track = BALLPARK.find((t) => t.id === id);
  const lvl = trackLevel(s, id);
  const next = track.tiers[lvl];
  if (!next) return false;
  addAT(s, { upgrades: 1 });
  if (id === "merch") s.merch = lvl + 1;
  else if (id === "tv") s.tv = lvl + 1;
  else s.stadium = { ...s.stadium, [id]: lvl + 1 };
  pushLog(s, `Built: ${next.name} (${next.label}).`, "win");
  return true;
}

// ── Club identity ──
export function rename(s, patch) { s.city = { ...s.city, ...patch }; }

// Current series position (regular season) and when the shop restocks
export function seriesNow(s) {
  return s.phase === "regular" && s.schedule && s.gameIndex < LEAGUE.seasonGames ? seriesInfo(s.schedule, s.gameIndex, s.form) : null;
}
export function restockNote(s) {
  if (s.phase === "draft") return "Winter catalog";
  if (s.phase === "playoffs") return "Restocks next round";
  const sr = seriesNow(s);
  return sr ? (sr.gamesLeft <= 1 ? "Leaves after this game" : `Leaves in ${sr.gamesLeft} games`) : "Restocks next series";
}
