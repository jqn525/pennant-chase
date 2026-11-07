// ── History: what happened, game by game, kept forever ──
// Pure helpers over s.hist. The franchise calls these at settle, on every
// purchase and at the offseason; the Stats tab reads them back.
//
//   s.hist = {
//     n,        absolute games played (the x-axis across seasons)
//     games,    compact rows, one per game (thinned to every 3rd for old seasons)
//     spend,    every purchase: { n, y, gi, cat, cost, pid, name, what, d, gain }
//     ovr,      pid -> [[n, ovr×10], ...] change points only
//     names,    pid -> name (so departed players still read)
//     seasons,  one rollup per finished season
//     records,  { game: {key -> rec}, season: {key -> rec} }
//   }

import { ovr } from "./gear.js";

export const GAME_FIELDS = ["n", "y", "gi", "po", "w", "rf", "ra", "home", "cash", "fans", "att", "gate", "win", "merch", "tv", "post", "pay", "spend", "tr", "place", "opp"];
const F = Object.fromEntries(GAME_FIELDS.map((k, i) => [k, i]));
export const row = (r) => Object.fromEntries(GAME_FIELDS.map((k, i) => [k, r[i]]));
export const field = (r, k) => r[F[k]];

export const SPEND_CATS = ["training", "gear", "upgrades", "prints", "draft", "trades", "tax"];

export const emptyHist = () => ({ n: 0, games: [], spend: [], ovr: {}, names: {}, seasons: [], records: { game: {}, season: {} } });
export function loadHist(h) {
  const e = emptyHist();
  if (!h || typeof h !== "object") return e;
  return { ...e, ...h, records: { ...e.records, ...(h.records || {}) } };
}

const r1 = (v) => Math.round(v * 10) / 10;
const ovr10 = (p) => Math.round(ovr(p) * 10);

// Record each player's overall when it changed since his last point
export function trackOvr(h, players) {
  for (const p of players) {
    if (!p) continue;
    h.names[p.id] = p.name;
    const v = ovr10(p);
    const s = h.ovr[p.id] || (h.ovr[p.id] = []);
    const last = s[s.length - 1];
    if (!last || last[1] !== v) {
      if (last && last[0] === h.n) last[1] = v; else s.push([h.n, v]);
    }
  }
}

// "contact +1, power +2" + "contact +1" -> "contact +2, power +2"
function mergeWhat(a, b) {
  const m = new Map();
  for (const part of `${a}, ${b}`.split(", ")) {
    const [k, n] = part.split(" +");
    if (n == null) return a;
    m.set(k, (m.get(k) || 0) + Number(n));
  }
  return [...m].map(([k, n]) => `${k} +${n}`).join(", ");
}

// One purchase. `before`/`after` are the player objects around the change.
export function noteSpend(h, { y, gi, cat, cost, pid = null, name = null, what, before = null, after = null }) {
  if (!cost) return null;
  // several buys for the same player in the same break merge into one event
  const last = h.spend[h.spend.length - 1];
  if (last && last.n === h.n && last.y === y && last.cat === cat && cat === "training" && last.pid === pid && pid != null) {
    last.cost += Math.round(cost);
    if (before && after) last.d = r1((last.d || 0) + ovr(after) - ovr(before));
    last.what = mergeWhat(last.what, what);
    return last;
  }
  const ev = { n: h.n, y, gi, cat, cost: Math.round(cost), what };
  if (pid != null) { ev.pid = pid; ev.name = name; h.names[pid] = name; }
  if (before && after) ev.d = r1(ovr(after) - ovr(before));
  const who = after || before;
  if (who) ev.r = who.role === "bat" ? "b" : "p";
  h.spend.push(ev);
  return ev;
}

// One finished game. g: header (won, us, them, home, opp, playoff); led: that game's ledger bucket
export function noteGame(h, { y, gi, playoff, won, us, them, home, opp, cash, fans, att, led, tr, place }) {
  h.n++;
  const spend = SPEND_CATS.reduce((t, k) => t - Math.min(0, led[k] || 0), 0);
  const r = { n: h.n, y, gi, po: playoff ? 1 : 0, w: won ? 1 : 0, rf: us, ra: them, home: home ? 1 : 0,
    cash: Math.round(cash), fans: Math.round(fans), att: Math.round(att),
    gate: Math.round(led.gate || 0), win: Math.round(led.winBonus || 0), merch: Math.round(led.merch || 0),
    tv: Math.round(led.tv || 0), post: Math.round(led.postseason || 0), pay: Math.round(led.payroll || 0),
    spend: Math.round(spend), tr: r1(tr), place, opp };
  h.games.push(GAME_FIELDS.map((k) => r[k]));
}

// Single-game records from this game's per-player lines
const GAME_RECS = [
  ["h", "Hits in a game", "bat"], ["hr", "Home runs in a game", "bat"], ["rbi", "RBI in a game", "bat"],
  ["kP", "Strikeouts in a game", "pit"],
];
export function noteGameRecords(h, lines, head) {
  const rec = h.records.game;
  for (const pid in lines) {
    for (const [k, label] of GAME_RECS) {
      const v = lines[pid][k] || 0;
      if (v > 0 && (!rec[k] || v > rec[k].v)) rec[k] = { v, label, pid, name: h.names[pid], y: head.y, gi: head.gi, opp: head.opp };
    }
  }
  const team = [
    ["runs", "Runs in a game", head.us],
    ["margin", "Biggest win", head.won ? head.us - head.them : 0],
    ["gate", "Best gate", head.gate],
    ["att", "Biggest crowd", head.att],
  ];
  for (const [k, label, v] of team) if (v > 0 && (!rec[k] || v > rec[k].v)) rec[k] = { v, label, y: head.y, gi: head.gi, opp: head.opp };
}

// Season bests from one finished season's stat table
export function noteSeasonRecords(h, y, seasonStats, names) {
  const rec = h.records.season;
  const best = (k, label, v, pid, fmt = null, low = false) => {
    if (!Number.isFinite(v)) return;
    const cur = rec[k];
    if (!cur || (low ? v < cur.v : v > cur.v)) rec[k] = { v, label, pid, name: names[pid] || h.names[pid], y, fmt };
  };
  for (const pid in seasonStats) {
    const s = seasonStats[pid];
    if (s.ab) {
      best("hr", "Home runs", s.hr, pid); best("rbi", "RBI", s.rbi, pid); best("h", "Hits", s.h, pid);
      if (s.ab >= 250) best("avg", "Batting average", s.h / s.ab, pid, "rate");
      if (s.ab >= 250) best("ops", "OPS", (s.h + s.bb) / (s.ab + s.bb) + (s.h + s.d + 2 * s.t + 3 * s.hr) / s.ab, pid, "rate");
    }
    if (s.outsP) {
      best("kP", "Strikeouts", s.kP, pid);
      if (s.outsP >= 180) best("era", "ERA", (s.raP * 27) / s.outsP, pid, "era", true);
    }
  }
}

// Close a season: roll it up, then thin older seasons to every third game
export function closeSeason(h, { y, w, l, finish, cup, ledger, fans, champion }) {
  const rows = h.games.filter((r) => field(r, "y") === y);
  const rf = rows.reduce((t, r) => t + field(r, "rf"), 0), ra = rows.reduce((t, r) => t + field(r, "ra"), 0);
  const spend = Object.fromEntries(SPEND_CATS.map((k) => [k, h.spend.filter((e) => e.y === y && e.cat === k).reduce((t, e) => t + e.cost, 0)]));
  h.seasons.push({
    y, w, l, rf, ra, finish, cup: !!cup, champion, ledger: { ...ledger }, spend,
    fans0: rows.length ? field(rows[0], "fans") : fans, fans1: fans,
    tr0: rows.length ? field(rows[0], "tr") : null, tr1: rows.length ? field(rows[rows.length - 1], "tr") : null,
  });
  // keep the newest two seasons per game; older ones every 3rd game plus every playoff game
  h.games = h.games.filter((r) => field(r, "y") >= y - 1 || field(r, "po") || field(r, "gi") % 3 === 2);
}

// Decode a season's game rows
export const seasonRows = (h, y) => h.games.filter((r) => field(r, "y") === y).map(row);
